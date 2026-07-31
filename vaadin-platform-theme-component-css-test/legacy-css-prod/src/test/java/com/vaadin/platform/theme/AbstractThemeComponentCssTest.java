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
package com.vaadin.platform.theme;

import java.io.File;
import java.net.URL;
import java.util.Collections;
import java.util.List;
import java.util.logging.Level;

import org.junit.Before;
import org.junit.BeforeClass;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.logging.LogEntries;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;

import io.github.bonigarcia.wdm.WebDriverManager;

import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.TestBench;
import com.vaadin.testbench.annotations.BrowserConfiguration;
import com.vaadin.testbench.parallel.Browser;
import com.vaadin.testbench.parallel.ParallelTest;
import com.vaadin.testbench.parallel.SauceLabsIntegration;

/**
 * Self-contained TestBench base for the per-component theme-CSS tests. Runs in
 * Chrome and knows how to wait for the Vaadin dev server (a no-op in production
 * mode). Kept independent of flow-test-util so the platform build does not pin
 * a specific flow test-artifact version.
 */
public abstract class AbstractThemeComponentCssTest extends ParallelTest {

    public static final int SERVER_PORT = Integer
            .parseInt(System.getProperty("serverPort", "8080"));

    @BeforeClass
    public static void setupClass() {
        String sauceKey = SauceLabsIntegration.getSauceAccessKey();
        String hubHost = System.getProperty(
                "com.vaadin.testbench.Parameters.hubHostname");
        if ((sauceKey == null || sauceKey.isEmpty())
                && (hubHost == null || hubHost.isEmpty())) {
            String driver = System.getProperty("webdriver.chrome.driver");
            if (driver == null || !new File(driver).exists()) {
                WebDriverManager.chromedriver().setup();
            }
        }
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
     * Opens the given path and, in development mode, waits for the dev server.
     */
    protected void open(String path) {
        getDriver().get(getRootURL() + path);
        waitForDevServer();
    }

    protected void waitForDevServer() {
        Object result;
        do {
            getCommandExecutor().waitForVaadin();
            result = getCommandExecutor().executeScript(
                    "return window.Vaadin && window.Vaadin.Flow && window.Vaadin.Flow.devServerIsNotLoaded;");
        } while (Boolean.TRUE.equals(result));
    }

    protected void waitForElementPresent(org.openqa.selenium.By by) {
        waitUntil(ExpectedConditions.presenceOfElementLocated(by));
    }

    protected void waitForElementNotPresent(org.openqa.selenium.By by) {
        waitUntil(driver -> {
            try {
                return driver.findElements(by).isEmpty();
            } catch (NoSuchElementException e) {
                return true;
            }
        });
    }

    protected LogEntries getLogEntries(Level level) {
        return getDriver().manage().logs().get(LogType.BROWSER);
    }

    protected String getRootURL() {
        return "http://" + getDeploymentHostname() + ":" + getDeploymentPort();
    }

    protected int getDeploymentPort() {
        return SERVER_PORT;
    }

    protected String getDeploymentHostname() {
        return "localhost";
    }

    @BrowserConfiguration
    public List<DesiredCapabilities> getBrowserConfiguration() {
        return Collections
                .singletonList(Browser.CHROME.getDesiredCapabilities());
    }
}
