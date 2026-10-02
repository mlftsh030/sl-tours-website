package com.sltours.accounts.dto;
public record SessionResponse(boolean authenticated, String email, String name, String role) {
    public static SessionResponse anonymous() { return new SessionResponse(false, null, null, null); }
}
