package com.sltours.trips.model;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/my-trip")
public class CustomerTripController {
    @GetMapping("/current")
    CustomerTripResponse currentTrip() {
        return new CustomerTripResponse(
                "Hello, Sarah",
                "Your Cape Town Journey",
                "12 December - 17 December",
                "Deposit recorded. Balance due before arrival.",
                "Hotel pickup at 07:45 from the V&A Waterfront lobby.",
                "Amina Daniels",
                "Sipho Mokoena",
                "Mercedes V-Class, 7 seats",
                List.of(
                        new CustomerTripResponse.ItineraryDay("13 December", List.of(
                                new CustomerTripResponse.ItineraryItem("07:45", "Hotel Pickup", "Meet your guide in the lobby."),
                                new CustomerTripResponse.ItineraryItem("08:30", "Atlantic Coast Drive", "Clifton, Camps Bay, and Chapman's Peak."),
                                new CustomerTripResponse.ItineraryItem("10:30", "Cape Point", "Scenic walk and lighthouse viewpoint."),
                                new CustomerTripResponse.ItineraryItem("14:00", "Boulders Penguins", "Guided visit at the penguin colony."),
                                new CustomerTripResponse.ItineraryItem("17:30", "Return", "Drop-off at your hotel."))),
                        new CustomerTripResponse.ItineraryDay("14 December", List.of(
                                new CustomerTripResponse.ItineraryItem("09:00", "Winelands", "Stellenbosch cellar visit and tasting."),
                                new CustomerTripResponse.ItineraryItem("13:00", "Franschhoek", "Lunch reservation and village walk.")))),
                List.of("Quotation SLT-Q-2026-0041", "Pickup confirmation"),
                "WhatsApp +27 67 012 7776 for urgent trip support.");
    }
}
