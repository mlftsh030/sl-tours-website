package com.sltours.accounts.service;
import com.sltours.accounts.dto.*;
import com.sltours.accounts.model.Account;
import com.sltours.accounts.repository.AccountRepository;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {
    private final AccountRepository accounts;
    private final PasswordEncoder passwords;
    public AccountService(AccountRepository accounts, PasswordEncoder passwords) {
        this.accounts = accounts; this.passwords = passwords;
    }
    public static String normalizeEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    @Transactional
    public void register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (accounts.existsByEmail(email)) throw new IllegalArgumentException("Unable to create an account with these details");
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72)
            throw new IllegalArgumentException("Password must be at most 72 UTF-8 bytes");
        Account account = new Account();
        account.setEmail(email); account.setName(request.name().trim());
        account.setPasswordHash(passwords.encode(request.password())); account.setRole(Account.Role.CUSTOMER);
        accounts.saveAndFlush(account);
    }
    @Transactional(readOnly = true)
    public SessionResponse session(String email) {
        return accounts.findByEmail(email).filter(Account::isEnabled)
            .map(a -> new SessionResponse(true, a.getEmail(), a.getName(), a.getRole().name()))
            .orElseGet(SessionResponse::anonymous);
    }
    @Transactional
    public void recordLogin(String email) {
        accounts.findByEmail(email).ifPresent(a -> a.setLastLoginAt(java.time.OffsetDateTime.now()));
    }
}
