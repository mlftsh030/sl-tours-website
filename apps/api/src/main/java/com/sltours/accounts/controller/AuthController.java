package com.sltours.accounts.controller;
import com.sltours.accounts.dto.*;
import com.sltours.accounts.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AccountService accounts;
    public AuthController(AccountService accounts) { this.accounts = accounts; }
    @GetMapping("/csrf") public CsrfToken csrf(CsrfToken token) { return token; }
    @GetMapping("/me") public SessionResponse session(Authentication authentication) {
        return authentication == null ? SessionResponse.anonymous() : accounts.session(authentication.getName());
    }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody RegisterRequest request) { accounts.register(request); }
}
