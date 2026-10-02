package com.sltours.trips.model;

import java.util.List;

public record CustomerTripResponse(
        String greeting,
        String title,
        String dateRange,
        String paymentStatus,
        String pickupDetails,
        String guide,
        String driver,
        String vehicle,
        List<ItineraryDay> itinerary,
        List<String> documents,
        String support
) {
    public record ItineraryDay(String date, List<ItineraryItem> items) {
    }

    public record ItineraryItem(String time, String title, String detail) {
    }
}
