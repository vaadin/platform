/**
 * Copyright (C) 2023 Vaadin Ltd
 *
 * This program is available under Vaadin Commercial License and Service Terms.
 *
 * See <https://vaadin.com/commercial-license-and-service-terms> for the full
 * license.
 */
package com.vaadin.shrinkwrap;

import com.vaadin.flow.component.dependency.NpmPackage;

/**
 * Empty class which makes flow add npm vaadin-core-shrinkwrap dependency.
 */
@NpmPackage(value = "@vaadin/vaadin-core-shrinkwrap", version = "${shrink.version}")
public class VaadinCoreShrinkWrap {
}