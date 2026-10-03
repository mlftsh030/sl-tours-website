package com.sltours.activities;
import com.sltours.activities.dto.ActivityDtos.*;
import com.sltours.activities.dto.ItineraryDtos.*;
import com.sltours.activities.model.ActivityEnums.*;
import com.sltours.activities.service.*;
import com.sltours.seo.SeoService;
import com.sltours.support.PostgresIntegrationTest;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import static org.assertj.core.api.Assertions.*;

@WithMockUser(username = "admin@test.local", roles = "ADMIN")
class ActivityCatalogueIntegrationTest extends PostgresIntegrationTest {
    @Autowired ActivityService activities;
    @Autowired ActivityAdminService admin;
    @Autowired ItineraryService itineraries;
    @Autowired SeoService seo;

    @Test void researchedCatalogueIsSeededWithSourcesAndDraftsStayHidden() {
        List<ActivityCard> cards = activities.list(null, null, null);
        assertThat(cards).hasSize(18).extracting(ActivityCard::slug)
            .contains("table-mountain-aerial-cableway", "grandwest-ice-station", "century-karting", "the-labia-theatre")
            .doesNotContain("kenilworth-karting", "lions-head-hike", "muizenberg-beach");
        assertThat(activities.list(Category.ICE_SKATING, null, null)).extracting(ActivityCard::slug).containsExactly("grandwest-ice-station");
        ActivityPage cableway = activities.get("table-mountain-aerial-cableway");
        assertThat(cableway.sources()).isNotEmpty().allSatisfy(s -> assertThat(s.url()).startsWith("https://www.tablemountain.net/"));
        assertThat(cableway.prices()).anySatisfy(p -> {
            assertThat(p.label()).isEqualTo("Adult return (online)"); assertThat(p.amountCents()).isEqualTo(47500);
            assertThat(p.effectiveTo()).isEqualTo(LocalDate.of(2027, 6, 30)); assertThat(p.sourceUrl()).contains("ticket-prices"); });
        assertThat(activities.get("century-karting").priceStatus()).isEqualTo(PriceStatus.NOT_PUBLISHED);
        assertThatThrownBy(() -> activities.get("lions-head-hike")).hasMessageContaining("not found");
    }

    @Test void capePointFeesAreNotAssumedAfterTheirPublishedEndDate() {
        LocalDate after = ActivityViews.today().isAfter(LocalDate.of(2026, 10, 31)) ? ActivityViews.today().plusDays(1) : LocalDate.of(2026, 11, 2);
        if (after.getDayOfWeek() == DayOfWeek.SUNDAY) after = after.plusDays(1);
        var request = new ItineraryRequest(after, LocalTime.of(8, 0), LocalTime.of(17, 0), 2, List.of(), Residency.INTERNATIONAL, List.of(),
            Area.CITY_CENTRE, Transport.OWN_VEHICLE, null, 500_000, 1, false, List.of("cape-point"));
        Itinerary plan = itineraries.plan(request);
        Stop capePoint = plan.stops().stream().filter(s -> "cape-point".equals(s.slug())).findFirst().orElseThrow();
        assertThat(capePoint.costs()).anySatisfy(l -> { assertThat(l.kind()).isEqualTo(CostKind.UNKNOWN); assertThat(l.detail()).contains("2026-10-31"); });
        assertThat(plan.verdict()).isEqualTo(Verdict.CANNOT_CONFIRM);
    }

    private SaveActivityRequest draft(String slug, long version, List<Source> sources, List<PriceRule> prices) {
        return new SaveActivityRequest(version, slug, "Test Rooftop Cinema", Category.CINEMA, "Outdoor films on a rooftop.", "Screenings in summer.",
            Area.CITY_CENTRE, "1 Test Street, Cape Town", "https://example.org", 120, ScheduleType.SCHEDULE_VARIES, true, false, null, null, null,
            prices.isEmpty() ? PriceStatus.NOT_PUBLISHED : PriceStatus.VERIFIED, "Test notes", null, null, null, null, sources, prices, List.of(), List.of(),
            List.of(new Faq("Is it outdoors?", "Yes, screenings are outdoors.")));
    }

    @Test void publishingNeedsSourcesAndVerificationAndRefreshesSeoAndSitemapImmediately() {
        String slug = "test-rooftop-cinema-" + UUID.randomUUID().toString().substring(0, 6);
        AdminActivity created = admin.create(draft(slug, 0, List.of(), List.of()));
        assertThat(created.publishProblems()).anySatisfy(p -> assertThat(p).contains("official operator"));
        assertThatThrownBy(() -> admin.setStatus(created.id(), created.version(), Status.PUBLISHED)).hasMessageContaining("Cannot publish yet");
        assertThat(seo.sitemap()).doesNotContain(slug);

        UUID source = UUID.randomUUID();
        var withSource = draft(slug, created.version(), List.of(new Source(source, "https://example.org/prices", "Rooftop Cinema",
            SourceType.OFFICIAL_OPERATOR, "Ticket price", LocalDate.now())), List.of(new PriceRule("Ticket", Audience.EVERYONE, null, null, Residency.ANY,
            Unit.PER_PERSON, 15000, null, null, null, null, true, null, null, source, LocalDate.now())));
        AdminActivity sourced = admin.update(created.id(), withSource);
        assertThat(sourced.publishProblems()).containsExactly("Mark the activity as verified after checking the sources");
        AdminActivity verified = admin.verify(created.id(), sourced.version());
        AdminActivity published = admin.setStatus(created.id(), verified.version(), Status.PUBLISHED);
        assertThat(published.status()).isEqualTo(Status.PUBLISHED);

        assertThat(seo.sitemap()).contains("/explore/" + slug);
        String head = seo.head("/explore/" + slug + "?utm=x");
        assertThat(head).contains("<title>Test Rooftop Cinema | Explore Cape Town | SL Tours</title>", "rel=\"canonical\" href=\"https://sl-tours.com/explore/" + slug + "\"",
            "\"@type\":\"TouristAttraction\"").doesNotContain("FAQPage", "noindex");
        assertThat(seo.body("/explore/" + slug)).contains("<h1>Test Rooftop Cinema</h1>", "Ticket: R150.00", "Is it outdoors?");

        // A published page cannot be edited into a state that breaks the publication rules.
        assertThatThrownBy(() -> admin.update(created.id(), draft(slug, published.version(), List.of(), List.of()))).hasMessageContaining("Unpublish it first");
        admin.setStatus(created.id(), published.version(), Status.DRAFT);
        assertThat(seo.sitemap()).doesNotContain(slug);
        assertThat(seo.head("/explore/" + slug)).contains("noindex");
    }

    @Test void privateAndUnknownPagesAreNotIndexedAndOutputIsEscaped() {
        assertThat(seo.head("/operations/bookings")).contains("noindex").doesNotContain("canonical");
        assertThat(seo.head("/book/cape-point-tour")).contains("noindex");
        assertThat(seo.head("/nope\"><script>")).contains("noindex").doesNotContain("<script>alert");
        assertThat(seo.head("/")).contains("\"@type\":\"TravelAgency\"").doesNotContain("makesOffer");
        assertThat(seo.sitemap()).contains("https://sl-tours.com/explore</loc>", "/experiences/cape-peninsula-journey");
    }
}
