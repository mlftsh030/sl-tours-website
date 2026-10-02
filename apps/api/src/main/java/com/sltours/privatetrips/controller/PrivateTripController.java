package com.sltours.privatetrips.controller;
import com.sltours.enquiries.dto.EnquiryReceipt;
import com.sltours.privatetrips.dto.PrivateTripDtos.*;
import com.sltours.privatetrips.service.PrivateTripService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/** Public private-trip booking. Prices and availability come only from the server. */
@RestController @Validated
@RequestMapping("/api/v1/private-trips")
public class PrivateTripController {
    private final PrivateTripService trips;
    public PrivateTripController(PrivateTripService trips) { this.trips = trips; }
    @GetMapping("/vehicles") FleetResult fleet() { return trips.fleet(); }
    @GetMapping("/availability")
    SearchResult availability(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(pattern = "HH:mm") LocalTime time,
            @RequestParam @Min(60) @Max(1440) int durationMinutes, @RequestParam @Min(1) @Max(80) int passengers) {
        return trips.search(date, time, durationMinutes, passengers);
    }
    @PostMapping("/requests")
    ResponseEntity<PrivateTripReceipt> request(@Valid @RequestBody PrivateTripRequest request, Authentication authentication) {
        PrivateTripReceipt receipt;
        try {
            receipt = trips.submit(request, authentication == null ? null : authentication.getName());
        } catch (DataIntegrityViolationException raced) {
            // An identical retry won the race; return its stored receipt.
            receipt = trips.submit(request, authentication == null ? null : authentication.getName());
        }
        return ResponseEntity.status(receipt.duplicate() ? HttpStatus.OK : HttpStatus.CREATED).body(receipt);
    }
    @PostMapping("/quote-requests")
    ResponseEntity<EnquiryReceipt> quote(@Valid @RequestBody QuoteRequest request) {
        EnquiryReceipt receipt = trips.requestQuote(request);
        return ResponseEntity.status(receipt.duplicate() ? HttpStatus.OK : HttpStatus.CREATED).body(receipt);
    }
}
