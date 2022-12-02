/*
 * Copyright 2000-2022 Vaadin Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.vaadin.platform.test;

import java.io.File;

import com.vaadin.testbench.parallel.SauceLabsIntegration;
import org.junit.Before;
import org.junit.BeforeClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.vaadin.testbench.IPAddress;
import com.vaadin.testbench.parallel.ParallelTest;

import io.github.bonigarcia.wdm.WebDriverManager;

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
        isLocal = !isSauce && !isHub;
        if (isLocal) {
            String driver = System.getProperty("webdriver.chrome.driver");
            if (driver == null || !new File(driver).exists()) {
                WebDriverManager.chromedriver().setup();
            }
        }
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
