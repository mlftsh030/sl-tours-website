package com.sltours.activities.dto;
import com.sltours.activities.model.ActivityEnums.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;

public final class ActivityDtos {
    private ActivityDtos() {}
    public record Source(UUID id, @NotBlank @Size(max = 500) @Pattern(regexp = "https?://.+", message = "Use a full http(s) link") String url,
        @NotBlank @Size(max = 160) String publisher, @NotNull SourceType sourceType, @NotBlank @Size(max = 300) String covers, @NotNull LocalDate accessedOn) {}
    public record PriceRule(@NotBlank @Size(max = 160) String label, @NotNull Audience audience, @Min(0) @Max(120) Integer minAge,
        @Min(0) @Max(120) Integer maxAge, @NotNull Residency residency, @NotNull Unit unit, @Min(0) @Max(100_000_000) int amountCents,
        @Size(max = 40) String daysOfWeek, LocalTime timeFrom, LocalTime timeTo, @Size(max = 400) String conditions, boolean estimateDefault,
        LocalDate effectiveFrom, LocalDate effectiveTo, UUID sourceId, @NotNull LocalDate verifiedOn) {}
    public record Extra(@NotBlank @Size(max = 160) String label, @Min(0) @Max(100_000_000) int amountCents, @NotNull Unit unit, boolean mandatory,
        @Size(max = 400) String conditions, LocalDate effectiveFrom, LocalDate effectiveTo, UUID sourceId, @NotNull LocalDate verifiedOn) {}
    public record Hours(@Size(max = 80) String seasonLabel, @Pattern(regexp = "[0-1][0-9]-[0-3][0-9]") String seasonStart,
        @Pattern(regexp = "[0-1][0-9]-[0-3][0-9]") String seasonEnd, @Size(max = 40) String daysOfWeek, @NotNull LocalTime opens,
        @NotNull LocalTime closes, LocalTime lastEntry, @Size(max = 300) String notes, UUID sourceId) {}
    public record Faq(@NotBlank @Size(max = 300) String question, @NotBlank @Size(max = 2000) String answer) {}

    public record SaveActivityRequest(@NotNull @Min(0) Long version,
        @NotBlank @Size(max = 160) @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*") String slug, @NotBlank @Size(max = 180) String title,
        @NotNull Category category, @NotBlank @Size(max = 400) String summary, @NotBlank @Size(max = 4000) String description, @NotNull Area area,
        @Size(max = 300) String address, @Size(max = 500) @Pattern(regexp = "(https?://.+)?") String officialUrl,
        @Min(15) @Max(720) int durationMinutes, @NotNull ScheduleType scheduleType, boolean weatherDependent, boolean indoor,
        @Min(0) @Max(99) Integer minAge, @Size(max = 300) String accompanimentRule, @Size(max = 600) String bookingNotes,
        @NotNull PriceStatus priceStatus, @Size(max = 2000) String verificationNotes, @Size(max = 220) String heroImage,
        @Size(max = 200) String heroImageAlt, @Size(max = 180) String seoTitle, @Size(max = 300) String seoDescription,
        @NotNull @Size(max = 20) List<@Valid @NotNull Source> sources, @NotNull @Size(max = 80) List<@Valid @NotNull PriceRule> priceRules,
        @NotNull @Size(max = 20) List<@Valid @NotNull Extra> extras, @NotNull @Size(max = 40) List<@Valid @NotNull Hours> hours,
        @NotNull @Size(max = 20) List<@Valid @NotNull Faq> faqs) {}

    /** Admin view: everything, including internal verification notes. */
    public record AdminActivity(UUID id, long version, Status status, String slug, String title, Category category, String summary,
        String description, Area area, String address, String officialUrl, int durationMinutes, ScheduleType scheduleType, boolean weatherDependent,
        boolean indoor, Integer minAge, String accompanimentRule, String bookingNotes, PriceStatus priceStatus, String verificationNotes,
        LocalDate lastVerifiedOn, String verifiedBy, boolean verificationStale, String heroImage, String heroImageAlt, String seoTitle,
        String seoDescription, OffsetDateTime publishedAt, OffsetDateTime updatedAt, List<Source> sources, List<PriceRule> priceRules,
        List<Extra> extras, List<Hours> hours, List<Faq> faqs, List<String> publishProblems) {}
    public record AdminActivitySummary(UUID id, Status status, String slug, String title, Category category, Area area, PriceStatus priceStatus,
        LocalDate lastVerifiedOn, boolean verificationStale, int priceRules, int sources, List<String> publishProblems) {}

    // Public views: no internal notes.
    public record PublicSource(String url, String publisher, SourceType sourceType, String covers, LocalDate accessedOn) {}
    public record PublicPrice(String label, Audience audience, Integer minAge, Integer maxAge, Residency residency, Unit unit, int amountCents,
        String daysOfWeek, LocalTime timeFrom, LocalTime timeTo, String conditions, LocalDate effectiveFrom, LocalDate effectiveTo,
        LocalDate verifiedOn, String sourceUrl, String sourcePublisher, boolean currentlyEffective) {}
    public record PublicExtra(String label, int amountCents, Unit unit, boolean mandatory, String conditions, LocalDate verifiedOn, String sourceUrl) {}
    public record PublicHours(String seasonLabel, String seasonStart, String seasonEnd, String daysOfWeek, LocalTime opens, LocalTime closes,
        LocalTime lastEntry, String notes) {}
    public record ActivityCard(String slug, String title, Category category, Area area, String areaLabel, String summary, int durationMinutes,
        PriceStatus priceStatus, Integer fromPriceCents, String fromPriceLabel, String heroImage, String heroImageAlt, boolean indoor,
        boolean weatherDependent, LocalDate lastVerifiedOn) {}
    public record ActivityPage(String slug, String title, Category category, Area area, String areaLabel, String summary, String description,
        String address, String officialUrl, int durationMinutes, ScheduleType scheduleType, boolean weatherDependent, boolean indoor,
        Integer minAge, String accompanimentRule, String bookingNotes, PriceStatus priceStatus, LocalDate lastVerifiedOn, String heroImage,
        String heroImageAlt, String seoTitle, String seoDescription, List<PublicPrice> prices, List<PublicExtra> extras, List<PublicHours> hours,
        List<Faq> faqs, List<PublicSource> sources, OffsetDateTime updatedAt) {}
}
