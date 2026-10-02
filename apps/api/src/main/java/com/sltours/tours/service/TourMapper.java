package com.sltours.tours.service;

import com.sltours.tours.dto.TourDetailResponse;
import com.sltours.tours.dto.TourSummaryResponse;
import com.sltours.tours.model.Tour;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class TourMapper {
    public TourSummaryResponse toSummary(Tour tour) {
        return new TourSummaryResponse(
                tour.getSlug(),
                tour.getTitle(),
                tour.getShortDescription(),
                tour.getDuration(),
                tour.getBasePriceCents(),
                tour.getPricingType(),
                tour.getCategory(),
                tour.isFeatured(),
                tour.getHeroImage(),
                tour.getCardNote(),
                copy(tour.getTags()));
    }

    public TourDetailResponse toDetail(Tour tour) {
        return new TourDetailResponse(
                tour.getSlug(),
                tour.getTitle(),
                tour.getShortDescription(),
                tour.getFullDescription(),
                tour.getDuration(),
                tour.getBasePriceCents(),
                tour.getPricingType(),
                tour.getMinimumGuests(),
                tour.getMaximumGuests(),
                copy(tour.getLocations()),
                copy(tour.getTags()),
                copy(tour.getHighlights()),
                copy(tour.getIncluded()),
                copy(tour.getExcluded()),
                copy(tour.getItinerary()),
                copy(tour.getFaqs()),
                tour.isPickupAvailable(),
                tour.getCategory(),
                tour.getHeroImage(),
                tour.getBannerImage(),
                tour.getSeoTitle(),
                tour.getSeoDescription());
    }

    private List<String> copy(List<String> values) {
        return List.copyOf(values);
    }
}
