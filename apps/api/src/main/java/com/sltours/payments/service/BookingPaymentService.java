package com.sltours.payments.service;
import com.sltours.audit.AuditService;
import com.sltours.partners.dto.PartnerDtos.*;
import com.sltours.partners.model.PartnerEnums.*;
import com.sltours.partners.service.*;
import com.sltours.shared.error.*;
import java.time.OffsetDateTime;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Administrator-recorded customer payments and refunds. A booking's amount paid is always the net of its rows, updated
 * under a row lock, and every change re-evaluates referral commission. Retries with the same key change nothing.
 */
@Service
public class BookingPaymentService {
    private final JdbcTemplate jdbc;
    private final CommissionService commissions;
    private final ReferralService referrals;
    private final PartnerSupport support;
    private final AuditService audit;
    public BookingPaymentService(JdbcTemplate jdbc, CommissionService commissions, ReferralService referrals, PartnerSupport support, AuditService audit) {
        this.jdbc = jdbc; this.commissions = commissions; this.referrals = referrals; this.support = support; this.audit = audit;
    }

    record Locked(UUID id, String status, int total, int netPaid, boolean demo) {}

    @Transactional
    public BookingFinance record(String reference, NewPayment p) {
        Locked b = lock(reference);
        UUID existingFor = jdbc.query("select booking_id from payments where idempotency_key = ?", (rs, i) -> (UUID) rs.getObject(1), p.idempotencyKey())
            .stream().findFirst().orElse(null);
        if (existingFor != null) {
            if (!existingFor.equals(b.id())) throw new ConflictException("This payment key was already used for another booking");
            return finance(reference);
        }
        if (b.demo()) throw new IllegalArgumentException("Payments cannot be recorded against development sample bookings");
        if (p.kind() == PaymentKind.PAYMENT) {
            if (Set.of("CANCELLED", "REFUNDED").contains(b.status())) throw new IllegalArgumentException("This booking is " + b.status().toLowerCase(Locale.ROOT));
            if (b.total() <= 0) throw new IllegalArgumentException("Set the booking's price before recording payments");
            if ((long) b.netPaid() + p.amountCents() > b.total())
                throw new IllegalArgumentException("This payment is more than the outstanding " + PartnerSupport.rand(b.total() - b.netPaid()));
        } else if (p.amountCents() > b.netPaid()) {
            throw new IllegalArgumentException("A refund cannot exceed the " + PartnerSupport.rand(b.netPaid()) + " paid");
        }
        UUID id = UUID.randomUUID();
        jdbc.update("""
            insert into payments (id, booking_id, method, status, amount_cents, external_reference, recorded_by, recorded_at, notes, kind, received_on, idempotency_key)
            values (?, ?, ?, 'RECORDED', ?, ?, ?, ?, ?, ?, ?, ?)""", id, b.id(), p.method().trim(), p.amountCents(), p.externalReference().trim(),
            PartnerSupport.actor(), OffsetDateTime.now(), p.notes(), p.kind().name(), p.receivedOn(), p.idempotencyKey());
        int net = b.netPaid() + (p.kind() == PaymentKind.PAYMENT ? p.amountCents() : -p.amountCents());
        jdbc.update("update bookings set amount_paid_cents = ?, version = version + 1, updated_at = ? where id = ?", net, OffsetDateTime.now(), b.id());
        audit.record(p.kind() == PaymentKind.PAYMENT ? "PAYMENT_RECORDED" : "REFUND_RECORDED", reference,
            PartnerSupport.rand(p.amountCents()) + " " + p.method().trim() + " ref " + p.externalReference().trim() + "; net paid " + PartnerSupport.rand(net));
        commissions.evaluate(b.id(), p.kind() == PaymentKind.REFUND ? id : null);
        return finance(reference);
    }

    /** Recalculates commission for a booking, for example after a partner is reinstated. */
    @Transactional
    public BookingFinance reevaluate(String reference) {
        Locked b = lock(reference);
        commissions.evaluate(b.id(), null);
        return finance(reference);
    }

    @Transactional(readOnly = true)
    public BookingFinance finance(String reference) {
        var row = jdbc.query("""
            select b.id, b.status, b.total_amount_cents, b.amount_paid_cents, b.referral_partner_id, p.reference, p.business_name, b.referral_code,
                b.referral_source, b.referral_captured_at from bookings b left join partners p on p.id = b.referral_partner_id where b.reference = ?""",
            (rs, i) -> new Object[]{rs.getObject(1), rs.getString(2), rs.getInt(3), rs.getInt(4), rs.getObject(5), rs.getString(6), rs.getString(7),
                rs.getString(8), rs.getString(9), PartnerSupport.time(rs.getTimestamp(10))}, reference).stream().findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        UUID bookingId = (UUID) row[0];
        var payments = jdbc.query("""
            select id, kind, amount_cents, method, external_reference, received_on, recorded_by, recorded_at from payments where booking_id = ? order by recorded_at""",
            (rs, i) -> new PaymentView((UUID) rs.getObject(1), PaymentKind.valueOf(rs.getString(2)), rs.getInt(3), rs.getString(4), rs.getString(5),
                rs.getObject(6, java.time.LocalDate.class), rs.getString(7), PartnerSupport.time(rs.getTimestamp(8))), bookingId);
        AttributionView attribution = row[4] == null ? null : new AttributionView((UUID) row[4], (String) row[5], (String) row[6], (String) row[7],
            row[8] == null ? null : ReferralSource.valueOf((String) row[8]), (OffsetDateTime) row[9], commissions.status(bookingId));
        return new BookingFinance(reference, (String) row[1], (int) row[2], (int) row[3], payments, attribution,
            commissions.lines("c.booking_id = ?", bookingId), referrals.history(bookingId));
    }

    private Locked lock(String reference) {
        return jdbc.query("select id, status, total_amount_cents, amount_paid_cents, demo_data from bookings where reference = ? for update",
            (rs, i) -> new Locked((UUID) rs.getObject(1), rs.getString(2), rs.getInt(3), rs.getInt(4), rs.getBoolean(5)), reference)
            .stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }
}
