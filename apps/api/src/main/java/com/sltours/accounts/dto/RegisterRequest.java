package com.sltours.accounts.dto;
import jakarta.validation.constraints.*;
public record RegisterRequest(
    @NotBlank @Size(max = 160) String name,
    @NotBlank @Email @Size(max = 180) String email,
    @NotBlank @Size(min = 12, max = 64) String password
) {
    @Override public String toString() { return "RegisterRequest[password=REDACTED]"; }
}
