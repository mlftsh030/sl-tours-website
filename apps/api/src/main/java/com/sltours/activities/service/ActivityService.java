package com.sltours.activities.service;
import com.sltours.activities.dto.ActivityDtos.*;
import com.sltours.activities.model.*;
import com.sltours.activities.model.ActivityEnums.*;
import com.sltours.activities.repository.ActivityRepository;
import com.sltours.shared.error.ResourceNotFoundException;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Public catalogue: published activities only. */
@Service
public class ActivityService {
    private final ActivityRepository activities;
    private final ActivityViews views;
    public ActivityService(ActivityRepository activities, ActivityViews views) { this.activities = activities; this.views = views; }

    @Transactional(readOnly = true)
    public List<ActivityCard> list(Category category, Area area, String query) {
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return activities.findByStatusOrderByTitleAsc(Status.PUBLISHED).stream()
            .filter(a -> category == null || a.getCategory() == category)
            .filter(a -> area == null || a.getArea() == area)
            .filter(a -> q.isEmpty() || (a.getTitle() + " " + a.getSummary()).toLowerCase(Locale.ROOT).contains(q))
            .map(a -> views.card(a, ActivityViews.today())).toList();
    }

    @Transactional(readOnly = true)
    public ActivityPage get(String slug) {
        return views.page(activities.findBySlugAndStatus(slug, Status.PUBLISHED).orElseThrow(() -> new ResourceNotFoundException("Activity not found")));
    }

    @Transactional(readOnly = true)
    public List<Activity> published() {
        List<Activity> list = activities.findByStatusOrderByTitleAsc(Status.PUBLISHED);
        // Initialise collections for use outside the transaction.
        list.forEach(a -> { a.getPriceRules().size(); a.getHours().size(); a.getExtras().size(); a.getSources().size(); a.getFaqs().size(); });
        return list;
    }
}
