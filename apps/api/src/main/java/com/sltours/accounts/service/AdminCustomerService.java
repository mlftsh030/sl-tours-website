package com.sltours.accounts.service;
import com.sltours.accounts.dto.AdminCustomerResponse;
import java.util.*;
import java.time.OffsetDateTime;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminCustomerService {
    private final JdbcTemplate jdbc;
    private final SessionRegistry sessions;
    public AdminCustomerService(JdbcTemplate jdbc, SessionRegistry sessions) { this.jdbc = jdbc; this.sessions = sessions; }
    private static final String PEOPLE = """
        with people as (
            select email from user_accounts where role = 'CUSTOMER'
            union select lower(customer_email) from bookings
        ), totals as (
            select lower(customer_email) as email, max(customer_name) as name, max(customer_phone) as phone,
                   count(*) as booking_count, sum(total_amount_cents) as total_amount_cents
            from bookings group by lower(customer_email)
        )
        """;
    @Transactional(readOnly = true)
    public Page<AdminCustomerResponse> list(int page, int size) {
        var online = new HashMap<String, Integer>();
        for (Object principal : sessions.getAllPrincipals()) {
            if (principal instanceof UserDetails user) online.put(user.getUsername(), sessions.getAllSessions(principal, false).size());
        }
        long count = jdbc.queryForObject(PEOPLE + "select count(*) from people", Long.class);
        var rows = jdbc.query(PEOPLE + """
            select p.email, coalesce(a.name,t.name) as name, t.phone, a.id is not null as registered,
                   coalesce(t.booking_count,0) as booking_count, coalesce(t.total_amount_cents,0) as total_amount_cents,
                   a.last_login_at
            from people p left join user_accounts a on a.email=p.email and a.role='CUSTOMER'
            left join totals t on t.email=p.email order by p.email limit ? offset ?
            """, (rs, row) -> new AdminCustomerResponse(rs.getString("name"), rs.getString("email"),
                rs.getString("phone"), rs.getBoolean("registered"), rs.getLong("booking_count"),
                rs.getLong("total_amount_cents"), rs.getObject("last_login_at", OffsetDateTime.class),
                online.getOrDefault(rs.getString("email"), 0)), size, (long) page * size);
        return new PageImpl<>(rows, PageRequest.of(page, size), count);
    }
}
