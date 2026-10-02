package com.sltours.operations.service;
import com.sltours.audit.AuditService;
import com.sltours.bookings.model.*;
import com.sltours.bookings.repository.BookingRepository;
import com.sltours.operations.dto.*;
import com.sltours.shared.error.*;
import java.time.*;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OperationsService {
    private final BookingRepository bookings;
    private final OperationsBookingMapper mapper;
    private final BookingStatusPolicy policy;
    private final AuditService audit;
    private final JdbcTemplate jdbc;
    private final com.sltours.assignments.service.AssignmentService assignments;
    public OperationsService(BookingRepository bookings, OperationsBookingMapper mapper,
            BookingStatusPolicy policy, AuditService audit, JdbcTemplate jdbc, com.sltours.assignments.service.AssignmentService assignments) {
        this.bookings = bookings; this.mapper = mapper; this.policy = policy; this.audit = audit; this.jdbc = jdbc; this.assignments = assignments;
    }
    @Transactional(readOnly = true)
    public OperationsDashboardResponse dashboard() {
        return new OperationsDashboardResponse(bookings.countByTravelDate(LocalDate.now(ZoneId.of("Africa/Johannesburg"))),
            bookings.countByStatus(BookingStatus.AWAITING_PAYMENT), bookings.countByStatus(BookingStatus.CONFIRMED),
            bookings.countByStatus(BookingStatus.ENQUIRY), bookings.sumNonCancelledRevenueCents(),
            jdbc.queryForObject("select count(*) from guides where status = 'ACTIVE'", Long.class),
            jdbc.queryForObject("""
                select count(*) from vehicles v where v.operational_status = 'ACTIVE'
                and not exists (select 1 from vehicle_restrictions r where r.vehicle_id = v.id and r.cleared_at is null)""", Long.class),
            jdbc.queryForObject("select count(*) from enquiries where status = 'NEW'", Long.class),
            jdbc.queryForObject("select count(*) from bookings where booking_type = 'PRIVATE_TRIP' and status = 'ENQUIRY'", Long.class),
            jdbc.queryForObject("select count(*) from vehicle_inspections where review_status = 'PENDING_REVIEW'", Long.class),
            jdbc.queryForObject("select count(*) from vehicle_restrictions where cleared_at is null", Long.class));
    }
    @Transactional(readOnly = true)
    public Page<OperationsBookingResponse> bookings(BookingStatus status, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        return (status == null ? bookings.findAll(pageable) : bookings.findByStatus(status, pageable)).map(mapper::toResponse);
    }
    @Transactional
    public OperationsBookingResponse updateStatus(String reference, BookingStatus status, long version) {
        Booking booking = bookings.findByReference(reference).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (booking.getVersion() != version) throw new ConflictException("This booking changed. Reload before updating.");
        var previous = booking.getStatus(); policy.validate(previous, status);
        if (booking.getBookingType() == BookingType.PRIVATE_TRIP && status == BookingStatus.CONFIRMED && previous != status)
            throw new IllegalArgumentException("Confirm private trips with “Confirm & assign” so a vehicle and driver are checked and reserved");
        if (status == BookingStatus.CANCELLED || status == BookingStatus.REFUNDED)
            assignments.cancelForBooking(booking, "Booking " + status.name().toLowerCase());
        booking.setStatus(status); bookings.flush();
        audit.record("BOOKING_STATUS_UPDATED", reference, previous + "->" + status);
        return mapper.toResponse(booking);
    }
}
