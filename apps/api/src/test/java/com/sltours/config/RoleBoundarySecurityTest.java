package com.sltours.config;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.sltours.accounts.repository.AccountRepository;
import com.sltours.accounts.service.AccountService;
import com.sltours.assignments.controller.AdminAssignmentController;
import com.sltours.assignments.service.*;
import com.sltours.drivers.controller.*;
import com.sltours.drivers.model.Driver;
import com.sltours.drivers.service.*;
import com.sltours.enquiries.controller.*;
import com.sltours.enquiries.dto.EnquiryReceipt;
import com.sltours.enquiries.model.EnquiryStatus;
import com.sltours.enquiries.service.EnquiryService;
import com.sltours.fleet.controller.AdminFleetController;
import com.sltours.fleet.service.*;
import com.sltours.inspections.service.InspectionService;
import com.sltours.media.*;
import com.sltours.privatetrips.controller.*;
import com.sltours.privatetrips.service.*;
import java.io.ByteArrayInputStream;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/** Every role boundary in the brief, checked through the real security filter chain. */
@WebMvcTest(controllers = { AdminEnquiryController.class, EnquiryController.class, AdminDriverController.class, DriverPortalController.class,
    AdminFleetController.class, AdminAssignmentController.class, AdminPrivateTripController.class, PrivateTripController.class,
    AdminMediaController.class, PublicMediaController.class, com.sltours.siteimages.SiteImageController.class })
@Import(SecurityConfig.class)
@TestPropertySource(properties = { "sltours.cors.allowed-origins=http://localhost:5173" })
class RoleBoundarySecurityTest {
    @Autowired MockMvc mvc;
    @MockBean EnquiryService enquiries;
    @MockBean AdminDriverService adminDrivers;
    @MockBean CurrentDriver currentDriver;
    @MockBean DriverAssignmentService driverAssignments;
    @MockBean InspectionService inspections;
    @MockBean DriverEligibility eligibility;
    @MockBean AccountRepository accounts;
    @MockBean AccountService accountService;
    @MockBean MediaService media;
    @MockBean FleetService fleet;
    @MockBean RestrictionService restrictions;
    @MockBean AdminAssignmentService adminAssignments;
    @MockBean PrivateTripAdminService privateTripAdmin;
    @MockBean PricingAdminService pricing;
    @MockBean PrivateTripService privateTrips;
    @MockBean com.sltours.siteimages.SiteImageService siteImages;

    private static final UUID ID = UUID.randomUUID();
    private static final String REVIEW = "{\"version\":0,\"notes\":\"ok\"}";

    @Test void driversHaveNoAccessToTheInboxCustomersOrAnyAdminArea() throws Exception {
        for (String path : List.of("/api/v1/admin/enquiries", "/api/v1/admin/enquiries/SLE-2026-AAAAA", "/api/v1/admin/customers",
                "/api/v1/admin/bookings", "/api/v1/admin/vehicles", "/api/v1/admin/assignments", "/api/v1/admin/inspections/pending",
                "/api/v1/admin/media/" + ID, "/api/v1/admin/drivers", "/api/v1/admin/pricing"))
            mvc.perform(get(path).with(user("driver@test.local").roles("DRIVER"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/enquiries/SLE-2026-AAAAA/notes").with(user("driver@test.local").roles("DRIVER")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"x\"}")).andExpect(status().isForbidden());
        verifyNoInteractions(enquiries, media, fleet, adminAssignments, adminDrivers, pricing);
    }

    @Test void onlyDriversReachTheDriverPortal() throws Exception {
        mvc.perform(get("/api/v1/driver/assignments")).andExpect(status().isUnauthorized());
        for (String role : List.of("CUSTOMER", "STAFF", "ADMIN"))
            mvc.perform(get("/api/v1/driver/assignments").with(user("someone").roles(role))).andExpect(status().isForbidden());
        when(currentDriver.require(any())).thenReturn(new Driver());
        mvc.perform(get("/api/v1/driver/assignments").with(user("driver@test.local").roles("DRIVER"))).andExpect(status().isOk());
    }

    @Test void staffCanWorkTheInboxAndReportProblemsButNotApproveClearAssignOrPrice() throws Exception {
        when(enquiries.list(any(), any(), any(), anyInt(), anyInt())).thenReturn(org.springframework.data.domain.Page.empty());
        mvc.perform(get("/api/v1/admin/enquiries").with(user("staff").roles("STAFF"))).andExpect(status().isOk());
        mvc.perform(post("/api/v1/admin/vehicles/" + ID + "/restrictions").with(user("staff").roles("STAFF")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"MAINTENANCE\",\"reason\":\"Tyre looks soft\"}")).andExpect(status().isOk());
        var staff = user("staff").roles("STAFF");
        mvc.perform(post("/api/v1/admin/inspections/" + ID + "/approve").with(staff).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(REVIEW))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/inspections/" + ID + "/reject").with(staff).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(REVIEW))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/vehicles/" + ID + "/restrictions/" + ID + "/clear").with(staff).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"version\":0,\"note\":\"Repaired and road tested\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/private-trips/SLT-2026-AAAAAA/confirm").with(staff).with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"version\":0,\"vehicleId\":\"" + ID + "\",\"driverId\":\"" + ID + "\"}")).andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/admin/pricing/rates/VAN").with(staff).with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"version\":0,\"hourlyRateCents\":50000,\"minimumMinutes\":120}")).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/drivers").with(staff)).andExpect(status().isForbidden());
        // Assignment options list driver eligibility problems, which are verification data.
        mvc.perform(get("/api/v1/admin/assignments/options?startsAt=2026-11-01T08:00:00Z&endsAt=2026-11-01T12:00:00Z").with(staff))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/site-images?slot=HOME_HERO").with(staff)).andExpect(status().isForbidden());
        verify(inspections, never()).approve(any(), any());
        verify(restrictions, never()).clear(any(), any(), anyLong(), any());
        verifyNoInteractions(privateTripAdmin, adminDrivers, siteImages);
        verify(adminAssignments, never()).options(any(), any(), anyInt());
        verify(pricing, never()).saveRate(any(), any());
    }

    @Test void driverDocumentsAreAdministratorOnlyAndPrivateFilesAreNeverPublic() throws Exception {
        MediaFile document = new MediaFile("driver_document/x.pdf", "application/pdf", 4, "0".repeat(64), "licence.pdf",
            MediaPurpose.DRIVER_DOCUMENT, MediaFile.Visibility.PRIVATE, "admin");
        when(media.find(ID)).thenReturn(document);
        when(media.open(document)).thenAnswer(i -> new ByteArrayInputStream("%PDF".getBytes()));
        mvc.perform(get("/api/v1/admin/media/" + ID).with(user("staff").roles("STAFF"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/media/" + ID).with(user("admin").roles("ADMIN"))).andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "private, no-store")).andExpect(header().string("X-Content-Type-Options", "nosniff"));
        mvc.perform(get("/api/v1/public/media/" + ID)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/admin/media/" + ID)).andExpect(status().isUnauthorized());
    }

    @Test void driversOnlyReceiveTheirOwnInspectionMedia() throws Exception {
        Driver driver = new Driver();
        when(currentDriver.require(any())).thenReturn(driver);
        when(inspections.driverMayView(driver, ID)).thenReturn(false);
        mvc.perform(get("/api/v1/driver/media/" + ID).with(user("driver@test.local").roles("DRIVER"))).andExpect(status().isNotFound());
        verify(media, never()).open(any());
    }

    @Test void driverInspectionUploadsRequireCsrfAndReachTheServiceAsTheSignedInDriver() throws Exception {
        Driver driver = new Driver();
        when(currentDriver.require(any())).thenReturn(driver);
        var json = new MockMultipartFile("inspection", "", "application/json", """
            {"odometerKm":100,"fuelLevel":"FULL","checklist":[{"item":"BRAKES","result":"OK"}],"photoTags":["VEHICLE"]}""".getBytes());
        var photo = new MockMultipartFile("photos", "a.jpg", "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});
        var selfie = new MockMultipartFile("selfie", "s.jpg", "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});
        mvc.perform(multipart("/api/v1/driver/assignments/" + ID + "/collection").file(json).file(photo).file(selfie)
            .with(user("driver@test.local").roles("DRIVER"))).andExpect(status().isForbidden());
        mvc.perform(multipart("/api/v1/driver/assignments/" + ID + "/collection").file(json).file(photo).file(selfie)
            .with(user("driver@test.local").roles("DRIVER")).with(csrf())).andExpect(status().isCreated());
        verify(inspections).submitCollection(same(driver), eq(ID), any(), argThat(list -> list.size() == 1), any());
    }

    @Test void publicVisitorsCanSubmitEnquiriesAndPrivateTripRequestsButNothingElse() throws Exception {
        when(enquiries.submit(any())).thenReturn(new EnquiryReceipt("SLE-2026-AAAAA", EnquiryStatus.NEW, "Thanks", false));
        mvc.perform(post("/api/v1/enquiries").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("""
            {"idempotencyKey":"%s","customerName":"A","customerEmail":"a@example.com","message":"Hello"}""".formatted(UUID.randomUUID())))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.reference").value("SLE-2026-AAAAA"));
        mvc.perform(post("/api/v1/enquiries").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"customerName\":\"A\",\"customerEmail\":\"a@example.com\",\"message\":\"Hello\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.idempotencyKey").exists());
        mvc.perform(get("/api/v1/private-trips/vehicles")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/admin/enquiries")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/admin/enquiries").with(user("customer").roles("CUSTOMER"))).andExpect(status().isForbidden());
    }
}
