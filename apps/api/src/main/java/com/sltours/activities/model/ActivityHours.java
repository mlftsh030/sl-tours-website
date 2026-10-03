package com.sltours.activities.model;
import jakarta.persistence.*;
import java.time.*;
import java.util.*;

/** Opening hours for a season and set of days, or a bookable session when the activity uses sessions. */
@Entity
@Table(name = "activity_hours")
public class ActivityHours {
    @Id private UUID id = UUID.randomUUID();
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "activity_id") private Activity activity;
    @Column(length = 80) private String seasonLabel;
    @Column(length = 5) private String seasonStart;
    @Column(length = 5) private String seasonEnd;
    @Column(length = 40) private String daysOfWeek;
    @Column(nullable = false) private LocalTime opens;
    @Column(nullable = false) private LocalTime closes;
    private LocalTime lastEntry;
    @Column(length = 300) private String notes;
    private UUID sourceId;
    @Column(nullable = false) private int sortOrder;
    protected ActivityHours() {}
    public ActivityHours(Activity activity) { this.activity = activity; }
    public UUID getId() { return id; }
    public String getSeasonLabel() { return seasonLabel; }
    public String getSeasonStart() { return seasonStart; }
    public String getSeasonEnd() { return seasonEnd; }
    public String getDaysOfWeek() { return daysOfWeek; }
    public LocalTime getOpens() { return opens; }
    public LocalTime getCloses() { return closes; }
    public LocalTime getLastEntry() { return lastEntry; }
    public String getNotes() { return notes; }
    public UUID getSourceId() { return sourceId; }
    public void set(String seasonLabel, String seasonStart, String seasonEnd, String daysOfWeek, LocalTime opens, LocalTime closes,
            LocalTime lastEntry, String notes, UUID sourceId, int sortOrder) {
        this.seasonLabel = seasonLabel; this.seasonStart = seasonStart; this.seasonEnd = seasonEnd; this.daysOfWeek = daysOfWeek; this.opens = opens;
        this.closes = closes; this.lastEntry = lastEntry; this.notes = notes; this.sourceId = sourceId; this.sortOrder = sortOrder;
    }
    /** Seasons are month-day ranges that may wrap over the new year (e.g. 12-01 to 01-31). */
    public boolean appliesOn(LocalDate date) {
        if (!DayRules.matches(daysOfWeek, date.getDayOfWeek())) return false;
        if (seasonStart == null) return true;
        MonthDay day = MonthDay.from(date), start = MonthDay.parse("--" + seasonStart), end = MonthDay.parse("--" + seasonEnd);
        return start.isAfter(end) ? !day.isBefore(start) || !day.isAfter(end) : !day.isBefore(start) && !day.isAfter(end);
    }
}
