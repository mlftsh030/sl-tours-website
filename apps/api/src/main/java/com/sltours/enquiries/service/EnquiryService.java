package com.sltours.enquiries.service;
import com.sltours.audit.AuditService;
import com.sltours.bookings.model.Booking;
import com.sltours.bookings.repository.BookingRepository;
import com.sltours.bookings.service.BookingService;
import com.sltours.enquiries.dto.*;
import com.sltours.enquiries.model.*;
import com.sltours.enquiries.repository.*;
import com.sltours.shared.error.*;
import com.sltours.shared.util.ReferenceCodes;
import com.sltours.tours.service.TourService;
import com.sltours.tripplanner.model.TripPlanningRequest;
import jakarta.persistence.criteria.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class EnquiryService {
    public static final String RECEIVED_MESSAGE = "Thank you. Your enquiry has been received and SL Tours will reply as soon as possible.";
    private final EnquiryRepository enquiries;
    private final EnquiryNoteRepository notes;
    private final EnquiryStatusPolicy policy;
    private final TourService tours;
    private final BookingService bookingService;
    private final BookingRepository bookings;
    private final AuditService audit;
    public EnquiryService(EnquiryRepository enquiries, EnquiryNoteRepository notes, EnquiryStatusPolicy policy,
            TourService tours, BookingService bookingService, BookingRepository bookings, AuditService audit) {
        this.enquiries = enquiries; this.notes = notes; this.policy = policy; this.tours = tours;
        this.bookingService = bookingService; this.bookings = bookings; this.audit = audit;
    }

    /** Returns the earlier receipt for a retried submission instead of storing a duplicate. */
    @Transactional(readOnly = true)
    public Optional<EnquiryReceipt> existing(UUID idempotencyKey) {
        return enquiries.findByIdempotencyKey(idempotencyKey)
            .map(e -> new EnquiryReceipt(e.getReference(), e.getStatus(), RECEIVED_MESSAGE, true));
    }

    @Transactional
    public EnquiryReceipt submit(CreateEnquiryRequest request) {
        var previous = existing(request.idempotencyKey());
        if (previous.isPresent()) return previous.get();
        Enquiry enquiry = new Enquiry();
        enquiry.setSource(EnquirySource.CONTACT_FORM);
        enquiry.setType(request.enquiryType() == null ? EnquiryType.GENERAL : request.enquiryType());
        if (StringUtils.hasText(request.tourSlug())) {
            enquiry.setTour(tours.findActiveBySlug(request.tourSlug().trim()));
            enquiry.setType(EnquiryType.TOUR);
        }
        applyContact(enquiry, request.customerName(), request.customerEmail(), request.customerPhone());
        enquiry.setMessage(request.message().trim());
        enquiry.setRequestedDate(request.requestedDate());
        enquiry.setPickupLocation(trimToNull(request.pickupLocation()));
        enquiry.setPassengers(request.passengers());
        enquiry.setIdempotencyKey(request.idempotencyKey());
        Enquiry saved = store(enquiry);
        return new EnquiryReceipt(saved.getReference(), saved.getStatus(), RECEIVED_MESSAGE, false);
    }

    /** Trip planner submissions are also inbox enquiries; called inside the planner's transaction. */
    @Transactional
    public Enquiry recordTripPlanner(TripPlanningRequest request, String summary, UUID idempotencyKey) {
        Enquiry enquiry = new Enquiry();
        enquiry.setSource(EnquirySource.TRIP_PLANNER); enquiry.setType(EnquiryType.GENERAL);
        enquiry.setReference(request.getReference());
        applyContact(enquiry, request.getCustomerName(), request.getCustomerEmail(), request.getCustomerPhone());
        enquiry.setMessage(summary.length() > 4000 ? summary.substring(0, 4000) : summary);
        enquiry.setRequestedDate(request.getArrivalDate());
        enquiry.setPassengers(Math.min(60, request.getAdults() + request.getChildren()));
        enquiry.setTripPlanningRequestId(request.getId());
        enquiry.setIdempotencyKey(idempotencyKey);
        return enquiries.saveAndFlush(enquiry);
    }

    /** Private-trip itineraries that need manual pricing arrive here as quote requests. */
    @Transactional
    public Enquiry recordPrivateTripQuote(Enquiry enquiry) {
        enquiry.setSource(EnquirySource.PRIVATE_TRIP_QUOTE); enquiry.setType(EnquiryType.PRIVATE_TRIP);
        return store(enquiry);
    }

    private Enquiry store(Enquiry enquiry) {
        if (enquiry.getReference() == null) enquiry.setReference(ReferenceCodes.next("SLE", 5, enquiries::existsByReference));
        return enquiries.saveAndFlush(enquiry);
    }

    @Transactional(readOnly = true)
    public Page<EnquirySummary> list(String query, EnquiryStatus status, EnquirySource source, int page, int size) {
        Specification<Enquiry> spec = (root, cq, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (status != null) where.add(cb.equal(root.get("status"), status));
            if (source != null) where.add(cb.equal(root.get("source"), source));
            if (StringUtils.hasText(query)) {
                String like = "%" + query.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                where.add(cb.or(
                    cb.like(cb.lower(root.get("reference")), like, '\\'),
                    cb.like(cb.lower(root.get("customerName")), like, '\\'),
                    cb.like(cb.lower(root.get("customerEmail")), like, '\\'),
                    cb.like(cb.lower(cb.coalesce(root.get("customerPhone"), "")), like, '\\'),
                    cb.like(cb.lower(root.get("message")), like, '\\')));
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        return enquiries.findAll(spec, pageable).map(this::summary);
    }

    @Transactional(readOnly = true)
    public EnquiryDetail get(String reference) { return detail(find(reference)); }

    @Transactional
    public EnquiryDetail updateStatus(String reference, UpdateEnquiryRequest request) {
        Enquiry enquiry = find(reference);
        checkVersion(enquiry, request.version());
        EnquiryStatus previous = enquiry.getStatus();
        policy.validate(previous, request.status());
        enquiry.setStatus(request.status());
        enquiries.flush();
        audit.record("ENQUIRY_STATUS_UPDATED", reference, previous + "->" + request.status());
        return detail(enquiry);
    }

    @Transactional
    public EnquiryDetail addNote(String reference, AddEnquiryNoteRequest request) {
        Enquiry enquiry = find(reference);
        notes.save(new EnquiryNote(enquiry.getId(), actor(), request.body().trim()));
        if (enquiry.getStatus() == EnquiryStatus.NEW) enquiry.setStatus(EnquiryStatus.IN_PROGRESS);
        enquiries.flush();
        return detail(enquiry);
    }

    @Transactional
    public ConversionResult convert(String reference, ConvertEnquiryRequest request) {
        Enquiry enquiry = find(reference);
        checkVersion(enquiry, request.version());
        if (!policy.canConvert(enquiry.getStatus()))
            throw new IllegalArgumentException("Only open enquiries can be converted. Reopen a closed enquiry first.");
        Booking booking = bookingService.createFromEnquiry(tours.findActiveBySlug(request.tourSlug()), request.travelDate(),
            request.guests(), enquiry.getCustomerName(), enquiry.getCustomerEmail(), enquiry.getCustomerPhone(),
            firstText(request.pickupLocation(), enquiry.getPickupLocation()),
            firstText(request.notes(), "Converted from enquiry " + enquiry.getReference()));
        linkConversion(enquiry, booking);
        return new ConversionResult(enquiry.getReference(), booking.getReference());
    }

    /** Marks an enquiry converted once a booking exists for it; used by tour and private-trip conversions. */
    @Transactional
    public void linkConversion(Enquiry enquiry, Booking booking) {
        if (!policy.canConvert(enquiry.getStatus()))
            throw new IllegalArgumentException("Only open enquiries can be converted. Reopen a closed enquiry first.");
        enquiry.setStatus(EnquiryStatus.CONVERTED);
        enquiry.setConvertedBookingId(booking.getId());
        enquiries.flush();
        audit.record("ENQUIRY_CONVERTED", enquiry.getReference(), "booking=" + booking.getReference());
    }

    @Transactional(readOnly = true)
    public Enquiry find(String reference) {
        return enquiries.findByReference(reference).orElseThrow(() -> new ResourceNotFoundException("Enquiry not found"));
    }

    @Transactional(readOnly = true)
    public void checkVersion(Enquiry enquiry, long version) {
        if (enquiry.getVersion() != version) throw new ConflictException("This enquiry changed. Reload before updating.");
    }

    @Transactional(readOnly = true)
    public long countNew() { return enquiries.countByStatus(EnquiryStatus.NEW); }

    private EnquirySummary summary(Enquiry e) {
        String preview = e.getMessage().length() > 140 ? e.getMessage().substring(0, 140) + "…" : e.getMessage();
        return new EnquirySummary(e.getReference(), e.getSource(), e.getType(), e.getStatus(), e.getCustomerName(),
            e.getCustomerEmail(), e.getCustomerPhone(), preview, e.getTour() == null ? null : e.getTour().getTitle(),
            e.getRequestedDate(), e.getPassengers(), e.getCreatedAt(), e.isDemoData());
    }

    private EnquiryDetail detail(Enquiry e) {
        String bookingReference = e.getConvertedBookingId() == null ? null
            : bookings.findById(e.getConvertedBookingId()).map(Booking::getReference).orElse(null);
        var noteList = notes.findByEnquiryIdOrderByCreatedAtAsc(e.getId()).stream()
            .map(n -> new EnquiryDetail.Note(n.getAuthor(), n.getBody(), n.getCreatedAt())).toList();
        return new EnquiryDetail(e.getReference(), e.getVersion(), e.getSource(), e.getType(), e.getStatus(),
            e.getCustomerName(), e.getCustomerEmail(), e.getCustomerPhone(), e.getMessage(),
            e.getTour() == null ? null : e.getTour().getSlug(), e.getTour() == null ? null : e.getTour().getTitle(),
            e.getRequestedDate(), e.getRequestedTime(), e.getDurationMinutes(), e.getPickupLocation(), e.getDestination(),
            e.getPassengers(), bookingReference, policy.next(e.getStatus()), noteList, e.getCreatedAt(), e.getUpdatedAt());
    }

    public static void applyContact(Enquiry enquiry, String name, String email, String phone) {
        enquiry.setCustomerName(name.trim());
        enquiry.setCustomerEmail(email.trim().toLowerCase(Locale.ROOT));
        enquiry.setCustomerPhone(trimToNull(phone));
    }
    private static String actor() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null ? "system" : authentication.getName();
    }
    private static String trimToNull(String value) { return StringUtils.hasText(value) ? value.trim() : null; }
    private static String firstText(String preferred, String fallback) { return StringUtils.hasText(preferred) ? preferred.trim() : fallback; }
}
