/*
 * Copyright 2000-2026 Vaadin Ltd.
 *
 * This program is available under Vaadin Commercial License and Service Terms.
 *
 * See <https://vaadin.com/commercial-license-and-service-terms> for the full license.
 */
package com.vaadin.platform.ee;

import java.util.function.Consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.vaadin.flow.server.Platform;
import com.vaadin.flow.server.ServiceInitEvent;
import com.vaadin.flow.server.startup.BaseLicenseCheckerServiceInitListener;
import com.vaadin.pro.licensechecker.BuildType;
import com.vaadin.pro.licensechecker.Capabilities;
import com.vaadin.pro.licensechecker.Capability;
import com.vaadin.pro.licensechecker.LicenseChecker;

/**
 * Service initialization listener for Vaadin Enterprise Edition.
 * <p>
 * It declares the {@value #PRODUCT_NAME} product and delegates the actual license
 * check to {@code super} ({@link BaseLicenseCheckerServiceInitListener}). At
 * runtime it logs a banner: the normal one when the license is valid, or a warning
 * when no valid license is found.
 */
public class EnterpriseEditionInitializer
        extends BaseLicenseCheckerServiceInitListener {

    private static final Logger LOGGER = LoggerFactory
            .getLogger(EnterpriseEditionInitializer.class);

    static final String PRODUCT_NAME = "vaadin-ee";

    public EnterpriseEditionInitializer() {
        super(PRODUCT_NAME, Platform.getVaadinVersion().orElse(""));
    }

    @Override
    public void serviceInit(ServiceInitEvent event) {
        String version = Platform.getVaadinVersion().orElse("");
        boolean productionMode = event.getSource()
                .getDeploymentConfiguration().isProductionMode();

        // Same banner in development and production: a big warning when there is
        // no valid license, the normal banner otherwise.
        if (isLicensed(version, productionMode)) {
            logEnterpriseBanner(version);
        } else {
            logNoLicenseBanner(version);
        }

        // Delegate the real license handling (in dev mode this offers the trial
        // through Dev Tools / Copilot; in production it does nothing).
        super.serviceInit(event);
    }

    private boolean isLicensed(String version, boolean productionMode) {
        // Throw on a missing key so the checker does not open a browser or wait
        // for a key download; we only want a silent yes/no probe here.
        Consumer<String> failOnMissingKey = url -> {
            throw new IllegalStateException("No " + PRODUCT_NAME + " license");
        };
        try {
            if (productionMode) {
                // production needs a real license; a pre-trial does not count
                LicenseChecker.checkLicense(PRODUCT_NAME, version,
                        BuildType.PRODUCTION, failOnMissingKey);
            } else {
                LicenseChecker.checkLicense(PRODUCT_NAME, version,
                        BuildType.DEVELOPMENT, failOnMissingKey,
                        Capabilities.of(Capability.PRE_TRIAL));
            }
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    private void logEnterpriseBanner(String productVersion) {
        String version = orUnknown(productVersion);
        LOGGER.info("""


                ============================================================
                   Running Vaadin Enterprise Edition {}
                ============================================================
                """, version);
    }

    private void logNoLicenseBanner(String productVersion) {
        String version = orUnknown(productVersion);
        LOGGER.warn("""


                ################################################################################
                ################################################################################
                ###
                ###   VAADIN ENTERPRISE EDITION {}
                ###
                ###   NO VALID ENTERPRISE EDITION LICENSE FOUND
                ###
                ###   This application depends on vaadin-ee but no valid Enterprise Edition
                ###   license was found for this machine.
                ###
                ###   Start a free trial or add your license from Vaadin Dev Tools,
                ###   or see https://vaadin.com/pricing
                ###
                ################################################################################
                ################################################################################
                """, version);
    }

    private static String orUnknown(String version) {
        return version == null || version.isEmpty() ? "unknown" : version;
    }
}
