package com.sltours.tours.dto;
import com.sltours.tours.model.TourStatus;
import java.util.UUID;
public record AdminTourResponse(UUID id, long version, TourStatus status, int displayOrder, String cardNote, TourDetailResponse detail) {}
