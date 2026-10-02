package com.sltours.config;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import static org.assertj.core.api.Assertions.*;

class ProductionSafetyCheckTest {
    private MockEnvironment env(String... profiles) { var e = new MockEnvironment(); e.setActiveProfiles(profiles); return e; }

    @Test void productionCannotShowSampleRatesEvenWhenConfigured() {
        var production = env("production").withProperty("sltours.pricing.allow-sample-rates", "true");
        assertThatThrownBy(() -> ProductionSafetyCheck.verify(production)).hasMessageContaining("allow-sample-rates");
        var noProfile = env().withProperty("sltours.pricing.allow-sample-rates", "true");
        assertThatThrownBy(() -> ProductionSafetyCheck.verify(noProfile)).hasMessageContaining("allow-sample-rates");
    }
    @Test void devProfileCannotBeCombinedWithProduction() {
        assertThatThrownBy(() -> ProductionSafetyCheck.verify(env("production", "dev"))).hasMessageContaining("cannot be combined");
        assertThatThrownBy(() -> ProductionSafetyCheck.verify(env("prod", "dev"))).hasMessageContaining("cannot be combined");
    }
    @Test void normalConfigurationsStart() {
        assertThatCode(() -> ProductionSafetyCheck.verify(env("production"))).doesNotThrowAnyException();
        assertThatCode(() -> ProductionSafetyCheck.verify(env("dev").withProperty("sltours.pricing.allow-sample-rates", "true"))).doesNotThrowAnyException();
    }
}
