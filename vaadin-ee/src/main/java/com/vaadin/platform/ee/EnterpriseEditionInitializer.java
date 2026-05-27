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
 * Service initialization listener to verify the Vaadin EE license.
 * <p>
 * The actual license check is delegated to
 * {@link BaseLicenseCheckerServiceInitListener}; this class only declares the
 * {@value #PRODUCT_NAME} product and logs an Enterprise Edition banner.
 * <p>
 * Agreed behavior for a missing or non covering {@value #PRODUCT_NAME} license
 * (decided with the Flow team):
 * <p>
 * Development mode: behave exactly like a commercial component such as Charts.
 * The license check is delegated to {@link BaseLicenseCheckerServiceInitListener},
 * which hands a missing key to Vaadin Dev Tools so Copilot can offer to start a
 * trial. The application keeps running so the trial on ramp is possible (relevant
 * for users who picked EE from start.vaadin.com without a subscription).
 * <p>
 * TODO (separate task): the Copilot / Dev Tools dialog currently only mentions the
 * pro web components and says nothing about {@value #PRODUCT_NAME}, which is
 * confusing. The dialog needs to be reworked to present the EE trial explicitly.
 * For this the license-checker should also offer a pre-trial for
 * {@value #PRODUCT_NAME} (return {@code PreTrialLicenseValidationException} with a
 * {@code PreTrial}, instead of a plain {@code LicenseException}), the same way it
 * does for products that have a frontend component.
 * <p>
 * Production mode: there is no hard runtime check (Vaadin never hard fails at
 * runtime). Enforcement is two fold:
 * <ul>
 * <li>TODO: the production build must fail when no {@value #PRODUCT_NAME} license
 * is present. Because {@value #PRODUCT_NAME} has no frontend component,
 * {@code build-frontend} does not detect it today, so this check has to be added
 * in flow / the Vaadin Maven plugin.</li>
 * <li>TODO: emit a console warning at runtime in production, reusing the mechanism
 * recently added for the extended maintenance warning, since each running instance
 * needs a license in addition to the one used at build time.</li>
 * </ul>
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
