/*
 * Copyright 2000-2026 Vaadin Ltd.
 *
 * This program is available under Vaadin Commercial License and Service Terms.
 *
 * See <https://vaadin.com/commercial-license-and-service-terms> for the full license.
 */
package com.vaadin.platform.ee;

import com.vaadin.flow.server.Platform;
import com.vaadin.flow.server.startup.BaseLicenseCheckerServiceInitListener;

/**
 * Service initialization listener to verify the Vaadin EE license.
 */
public class LicenseCheckerServiceInitListener
        extends BaseLicenseCheckerServiceInitListener {

    static final String PRODUCT_NAME = "vaadin-ee";

    public LicenseCheckerServiceInitListener() {
        super(PRODUCT_NAME, Platform.getVaadinVersion().orElse(""));
    }
}
