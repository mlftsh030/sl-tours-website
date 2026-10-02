package com.sltours.accounts.dto;
import java.time.OffsetDateTime;
public record AdminCustomerResponse(String name, String email, String phone, boolean registered,
    long bookingCount, long totalAmountCents, OffsetDateTime lastLoginAt, int activeSessions) {}
