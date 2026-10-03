package com.sltours.activities.model;
import com.sltours.activities.model.ActivityEnums.*;
import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "activities")
public class Activity {
    @Id private UUID id = UUID.randomUUID();
    @Version private Long version;
    @Column(nullable = false, unique = true, length = 160) private String slug;
    @Column(nullable = false, length = 180) private String title;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private Category category;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Status status = Status.DRAFT;
    @Column(nullable = false, length = 400) private String summary;
    @Column(nullable = false, length = 4000) private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private Area area;
    @Column(length = 300) private String address;
    @Column(length = 500) private String officialUrl;
    @Column(name = "typical_duration_minutes", nullable = false) private int durationMinutes;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private ScheduleType scheduleType;
    @Column(nullable = false) private boolean weatherDependent;
    @Column(nullable = false) private boolean indoor;
    private Integer minAge;
    @Column(length = 300) private String accompanimentRule;
    @Column(length = 600) private String bookingNotes;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private PriceStatus priceStatus;
    @Column(length = 2000) private String verificationNotes;
    private LocalDate lastVerifiedOn;
    @Column(length = 180) private String verifiedBy;
    @Column(length = 220) private String heroImage;
    @Column(length = 200) private String heroImageAlt;
    @Column(length = 180) private String seoTitle;
    @Column(length = 300) private String seoDescription;
    private OffsetDateTime publishedAt;
    /** Set when the entry came from an approved supplier proposal; written only by the partnership service. */
    @Column(insertable = false, updatable = false) private UUID supplierPartnerId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private ParticipationRules participationRules = ParticipationRules.KNOWN;
    @Column(length = 400) private String participationNote;
    @Column(nullable = false) private OffsetDateTime createdAt;
    @Column(nullable = false) private OffsetDateTime updatedAt;
    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("sortOrder")
    private List<ActivitySource> sources = new ArrayList<>();
    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("sortOrder")
    private List<ActivityPriceRule> priceRules = new ArrayList<>();
    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("sortOrder")
    private List<ActivityExtra> extras = new ArrayList<>();
    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("sortOrder")
    private List<ActivityHours> hours = new ArrayList<>();
    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("sortOrder")
    private List<ActivityFaq> faqs = new ArrayList<>();
    @PrePersist void onCreate() { createdAt = OffsetDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = OffsetDateTime.now(); }

    public UUID getId() { return id; }
    public long getVersion() { return version == null ? 0 : version; }
    public String getSlug() { return slug; }
    public void setSlug(String v) { slug = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { title = v; }
    public Category getCategory() { return category; }
    public void setCategory(Category v) { category = v; }
    public Status getStatus() { return status; }
    public void setStatus(Status v) { status = v; }
    public String getSummary() { return summary; }
    public void setSummary(String v) { summary = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { description = v; }
    public Area getArea() { return area; }
    public void setArea(Area v) { area = v; }
    public String getAddress() { return address; }
    public void setAddress(String v) { address = v; }
    public String getOfficialUrl() { return officialUrl; }
    public void setOfficialUrl(String v) { officialUrl = v; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int v) { durationMinutes = v; }
    public ScheduleType getScheduleType() { return scheduleType; }
    public void setScheduleType(ScheduleType v) { scheduleType = v; }
    public boolean isWeatherDependent() { return weatherDependent; }
    public void setWeatherDependent(boolean v) { weatherDependent = v; }
    public boolean isIndoor() { return indoor; }
    public void setIndoor(boolean v) { indoor = v; }
    public Integer getMinAge() { return minAge; }
    public void setMinAge(Integer v) { minAge = v; }
    public String getAccompanimentRule() { return accompanimentRule; }
    public void setAccompanimentRule(String v) { accompanimentRule = v; }
    public String getBookingNotes() { return bookingNotes; }
    public void setBookingNotes(String v) { bookingNotes = v; }
    public PriceStatus getPriceStatus() { return priceStatus; }
    public void setPriceStatus(PriceStatus v) { priceStatus = v; }
    public String getVerificationNotes() { return verificationNotes; }
    public void setVerificationNotes(String v) { verificationNotes = v; }
    public LocalDate getLastVerifiedOn() { return lastVerifiedOn; }
    public String getVerifiedBy() { return verifiedBy; }
    public void markVerified(LocalDate on, String by) { lastVerifiedOn = on; verifiedBy = by; }
    public String getHeroImage() { return heroImage; }
    public void setHeroImage(String v) { heroImage = v; }
    public String getHeroImageAlt() { return heroImageAlt; }
    public void setHeroImageAlt(String v) { heroImageAlt = v; }
    public String getSeoTitle() { return seoTitle; }
    public void setSeoTitle(String v) { seoTitle = v; }
    public String getSeoDescription() { return seoDescription; }
    public void setSeoDescription(String v) { seoDescription = v; }
    public OffsetDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(OffsetDateTime v) { publishedAt = v; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public UUID getSupplierPartnerId() { return supplierPartnerId; }
    public ParticipationRules getParticipationRules() { return participationRules; }
    public void setParticipationRules(ParticipationRules v) { participationRules = v; }
    public String getParticipationNote() { return participationNote; }
    public void setParticipationNote(String v) { participationNote = v; }
    public List<ActivitySource> getSources() { return sources; }
    public List<ActivityPriceRule> getPriceRules() { return priceRules; }
    public List<ActivityExtra> getExtras() { return extras; }
    public List<ActivityHours> getHours() { return hours; }
    public List<ActivityFaq> getFaqs() { return faqs; }
}
