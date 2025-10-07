/*
 * Copyright 2000-2023 Vaadin Ltd.
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
package com.vaadin.platform.react.test;

import java.util.List;
import java.util.Optional;

import com.vaadin.flow.component.UI;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.openqa.selenium.By;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.vaadin.flow.component.sidenav.testbench.SideNavElement;
import com.vaadin.flow.component.sidenav.testbench.SideNavItemElement;
import com.vaadin.testbench.IPAddress;
import com.vaadin.testbench.parallel.ParallelTest;
import com.vaadin.testbench.parallel.SauceLabsIntegration;

public abstract class AbstractPlatformTest extends ParallelTest {

    public static final int SERVER_PORT = Integer.parseInt(
            System.getProperty("serverPort", "8080"));

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
        String hubHost = System.getProperty(
                "com.vaadin.testbench.Parameters.hubHostname");
        isHub = !isSauce && hubHost != null && !hubHost.isEmpty();

        hostName = isHub ? IPAddress.findSiteLocalAddress() : "localhost";
        getLogger().info("Running Tests app-url=http://{}:{} mode={}", hostName,
                SERVER_PORT, isSauce ?
                        "SAUCE (user:" + SauceLabsIntegration.getSauceUser() +
                                ")" : isHub ? "HUB (hub-host:" + hubHost + ")" :
                        "LOCAL (chromedriver)");
    }

    @Before
    public void setUp() {
        getDriver().get(getRootURL() + getTestPath());
        getDriver().manage().window().fullscreen();
    }

    /**
     * Gets the absolute path to the test, starting with a "/".
     *
     * @return he path to the test, appended to {@link #getRootURL()} for the
     * full test URL.
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

    /**
     * Get the sideNavItem with given label
     *
     * @param label label to look for
     * @return sidenav with label if found
     */
    protected Optional<SideNavItemElement> getMenuElement(String label) {
        List<SideNavItemElement> items = $(SideNavElement.class).first()
                .getItems();
        return items.stream().filter(item -> item.getLabel().equals(label))
                .findFirst();
    }

    /**
     * Wait for element else fail with message.
     *
     * @param message failure message
     * @param by      By for locating element
     */
    protected void waitForElement(String message, By by) {
        try {
            waitUntil(ExpectedConditions.presenceOfElementLocated(by));
        } catch (TimeoutException te) {
            Assert.fail(message);
        }
    }
}