/*
 * Copyright 2000-2026 Vaadin Ltd.
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
package com.vaadin.platform.reload;

import java.io.File;
import java.net.URL;
import java.util.Collections;
import java.util.List;

import org.junit.Before;
import org.junit.BeforeClass;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;

import com.vaadin.testbench.IPAddress;
import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.TestBench;
import com.vaadin.testbench.annotations.BrowserConfiguration;
import com.vaadin.testbench.parallel.Browser;
import com.vaadin.testbench.parallel.ParallelTest;
import com.vaadin.testbench.parallel.SauceLabsIntegration;

/**
 * TestBench base class for the reload-time benchmark. Runs in Chrome (locally,
 * on a hub or on Sauce Labs) and knows how to wait for the Vaadin dev server,
 * which the benchmark relies on since it runs in development mode.
 */
public abstract class AbstractReloadBenchmarkTest extends ParallelTest {

    public static final int SERVER_PORT = Integer
            .parseInt(System.getProperty("serverPort", "8888"));

    static String hostName;

    @BeforeClass
    public static void setupClass() {
        String sauceKey = SauceLabsIntegration.getSauceAccessKey();
        String hubHost = System.getProperty(
                "com.vaadin.testbench.Parameters.hubHostname");
        boolean isSauce = sauceKey != null && !sauceKey.isEmpty();
        boolean isHub = hubHost != null && !hubHost.isEmpty();

        // When the browser runs on a remote hub, "localhost" resolves on the
        // hub node rather than the machine running the app, so use a reachable
        // site-local address instead.
        hostName = (!isSauce && isHub) ? IPAddress.findSiteLocalAddress()
                : "localhost";
    }

    @Before
    @Override
    public void setup() throws Exception {
        ChromeOptions chromeOptions = customizeChromeOptions(new ChromeOptions());
        WebDriver driver;
        if (getRunLocallyBrowser() != null
                || Parameters.isLocalWebDriverUsed()) {
            driver = new ChromeDriver(chromeOptions);
        } else if (SauceLabsIntegration.isConfiguredForSauceLabs()
                || getRunOnHub(getClass()) != null
                || Parameters.getHubHostname() != null) {
            driver = new RemoteWebDriver(new URL(getHubURL()),
                    chromeOptions.merge(getDesiredCapabilities()));
        } else {
            driver = new ChromeDriver(chromeOptions);
        }
        setDriver(TestBench.createDriver(driver));
    }

    private ChromeOptions customizeChromeOptions(ChromeOptions chromeOptions) {
        // For test stability on Linux CI runners.
        chromeOptions.addArguments("--disable-dev-shm-usage");
        if (Boolean.getBoolean("com.vaadin.testbench.Parameters.headless")) {
            chromeOptions.addArguments("--headless=new");
        }
        String extraArgs = System.getProperty("chrome.extraArgs");
        if (extraArgs != null && !extraArgs.isBlank()) {
            for (String arg : extraArgs.split("[,\\s]+")) {
                if (!arg.isBlank()) {
                    chromeOptions.addArguments(arg);
                }
            }
        }
        return chromeOptions;
    }

    /**
     * If the dev server start is in progress, wait until it has started.
     */
    protected void waitForDevServer() {
        Object result;
        do {
            getCommandExecutor().waitForVaadin();
            result = getCommandExecutor().executeScript(
                    "return window.Vaadin && window.Vaadin.Flow && window.Vaadin.Flow.devServerIsNotLoaded;");
        } while (Boolean.TRUE.equals(result));
    }

    protected String getRootURL() {
        return "http://" + getDeploymentHostname() + ":" + getDeploymentPort();
    }

    protected int getDeploymentPort() {
        return SERVER_PORT;
    }

    protected String getDeploymentHostname() {
        return hostName;
    }

    @BrowserConfiguration
    public List<DesiredCapabilities> getBrowserConfiguration() {
        return Collections
                .singletonList(Browser.CHROME.getDesiredCapabilities());
    }
}
