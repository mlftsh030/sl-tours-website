package com.sltours.accounts.controller;
import com.sltours.accounts.dto.AdminCustomerResponse;
import com.sltours.accounts.service.AdminCustomerService;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
@RestController @Validated
@RequestMapping("/api/v1/admin/customers")
public class AdminCustomerController {
    private final AdminCustomerService customers;
    public AdminCustomerController(AdminCustomerService customers) { this.customers = customers; }
    @GetMapping public com.sltours.shared.dto.PageResponse<AdminCustomerResponse> list(@RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) { return com.sltours.shared.dto.PageResponse.from(customers.list(page, size)); }
}
