/**
 * Copyright (C) 2023 Vaadin Ltd
 *
 * This program is available under Vaadin Commercial License and Service Terms.
 *
 * See <https://vaadin.com/commercial-license-and-service-terms> for the full
 * license.
 */
package com.vaadin.platform.gradle.test;

import java.io.File;

import org.junit.Before;
import org.junit.BeforeClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.vaadin.testbench.IPAddress;
import com.vaadin.testbench.parallel.ParallelTest;
import com.vaadin.testbench.parallel.SauceLabsIntegration;

public abstract class AbstractPlatformTest extends ParallelTest {

    public static final int SERVER_PORT = Integer
            .parseInt(System.getProperty("serverPort", "8080"));

    static String hostName;
    static boolean isSauce;
    static boolean isHub;
    static boolean isLocal;

    static Logger getLogger() {
        return LoggerFactory.getLogger(AbstractPlatformTest.class);
    }

    @BeforeClass
    public static void setupClass() {
        isSauce = SauceLabsIntegration.isConfiguredForSauceLabs();
        String hubHost = System
                .getProperty("com.vaadin.testbench.Parameters.hubHostname");
        isHub = !isSauce && hubHost != null && !hubHost.isEmpty();

        hostName = isHub ? IPAddress.findSiteLocalAddress() : "localhost";
        getLogger().info("Running Tests app-url=http://{}:{} mode={}", hostName,
                SERVER_PORT,
                isSauce ? "SAUCE (user:" + SauceLabsIntegration.getSauceUser() + ")"
                        : isHub ? "HUB (hub-host:" + hubHost + ")"
                        : "LOCAL (chromedriver)");
    }

    @Before
    public void setUp() {
        getDriver().get(getRootURL() + getTestPath());
    }

    /**
     * Gets the absolute path to the test, starting with a "/".
     *
     * @return he path to the test, appended to {@link #getRootURL()} for the
     *         full test URL.
     */
    protected abstract String getTestPath();

    /**
     * Returns the URL to the root of the server, e.g. "http://localhost:8888".
     *
     * @return the URL to the root
     */
    protected String getRootURL() {
        return "http://" + getDeploymentHostname() + ":" + getDeploymentPort();
    }

    /**
     * Used to determine what port the test is running on.
     *
     * @return The port the test is running on, by default 8080
     */
    protected int getDeploymentPort() {
        return SERVER_PORT;
    }

    /**
     * Used to determine what URL to initially open for the test.
     *
     * @return the host name of development server
     */
    protected String getDeploymentHostname() {
        return hostName;
    }
}
