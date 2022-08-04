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
package com.vaadin.platform.fusion.offline;

import java.io.IOException;
import java.lang.reflect.Field;
import java.net.URL;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.io.File;

import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.TestBench;
import com.vaadin.testbench.TestBenchDriverProxy;
import com.vaadin.testbench.annotations.BrowserConfiguration;
import com.vaadin.testbench.parallel.Browser;
import com.vaadin.testbench.parallel.ParallelTest;

import com.vaadin.testbench.parallel.SauceLabsIntegration;
import org.junit.Assert;
import org.junit.Before;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.BeforeClass;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.mobile.NetworkConnection;
import org.openqa.selenium.remote.Command;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.remote.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.vaadin.platform.fusion.offline.SauceLabsHelper.getSauceAccessKey;
import static com.vaadin.platform.fusion.offline.SauceLabsHelper.getSauceUser;

/**
 * Base class for TestBench tests to run in Chrome with customized options,
 * which enable device emulation mode by default.
 * <p>
 * This facilitates testing with network connection overrides, e. g., using
 * offline mode in the tests.
 * <p>
 * It is required to set system property with path to the driver to be able to
 * run the test.
 * <p>
 * The test can be executed locally and on a test Hub. ChromeDriver is used
 * if test is executed locally.
 *
 * @author Vaadin Ltd
 * @since 1.0
 *
 */
public abstract class ChromeDeviceTest extends ParallelTest {
    public static final int SERVER_PORT = Integer
            .parseInt(System.getProperty("serverPort", "8080"));

    private static final String SAUCE_USERNAME_ENV = "SAUCE_USERNAME";
    private static final String SAUCE_USERNAME_PROP = "sauce.user";
    private static final String SAUCE_ACCESS_KEY_ENV = "SAUCE_ACCESS_KEY";
    private static final String SAUCE_ACCESS_KEY_PROP = "sauce.sauceAccessKey";

    private DevToolsWrapper devTools = null;

    protected DevToolsWrapper getDevTools() {
        return devTools;
    }

    private static Logger getLogger() {
        return LoggerFactory.getLogger(SauceLabsIntegration.class);
    }

    @BeforeClass
    public static void setupClass() {
        String sauceKey = System.getProperty("sauce.sauceAccessKey");
        String hubHost = System.getProperty("com.vaadin.testbench.Parameters.hubHostname");
        if ((sauceKey == null || sauceKey.isEmpty()) && (hubHost == null || hubHost.isEmpty())) {
            String driver = System.getProperty("webdriver.chrome.driver");
            if (driver == null || !new File(driver).exists()) {
                WebDriverManager.chromedriver().setup();
            }
        }
    }

    @Before
    @Override
    public void setup() throws Exception {
        ChromeOptions chromeOptions =
                customizeChromeOptions(new ChromeOptions());
        WebDriver driver;
        // Always give priority to @RunLocally annotation
        if ((getRunLocallyBrowser() != null)) {
            driver = new ChromeDriver(chromeOptions);
        } else if (Parameters.isLocalWebDriverUsed()) {
            driver = new ChromeDriver(chromeOptions);
        } else if (SauceLabsHelper.isConfiguredForSauceLabs()) {
            URL remoteURL = new URL(getHubURL());
            chromeOptions = chromeOptions.merge(getDesiredCapabilities());
            driver = new RemoteWebDriver(remoteURL, chromeOptions);
            setDevToolsRuntimeCapabilities((RemoteWebDriver) driver, remoteURL);
        } else if (getRunOnHub(getClass()) != null
                || Parameters.getHubHostname() != null) {
            URL remoteURL = new URL(getHubURL());
            chromeOptions = chromeOptions.merge(getDesiredCapabilities());
            driver = new RemoteWebDriver(remoteURL, chromeOptions);
            setDevToolsRuntimeCapabilities((RemoteWebDriver) driver, remoteURL);
        } else {
            driver = new ChromeDriver(chromeOptions);
        }
        devTools = new DevToolsWrapper(driver);

        setDriver(TestBench.createDriver(driver));
    }

    /**
     * Customizes given Chrome options to enable network connection emulation.
     *
     * @param chromeOptions Chrome options to customize
     * @return customized Chrome options instance
     */
    protected ChromeOptions customizeChromeOptions(ChromeOptions chromeOptions) {
        final Map<String, Object> mobileEmulationParams = new HashMap<>();
        mobileEmulationParams.put("deviceName", "Laptop with touch");

        chromeOptions.setExperimentalOption("mobileEmulation",
                mobileEmulationParams);

        // Enable service workers over http remote connection
        chromeOptions.addArguments(String.format(
                "--unsafely-treat-insecure-origin-as-secure=%s",
                getRootURL()));

        // NOTE: this flag is not supported in headless Chrome, see
        // https://crbug.com/814146

        // For test stability on Linux when not running headless.
        // https://stackoverflow.com/questions/50642308/webdriverexception-unknown-error-devtoolsactiveport-file-doesnt-exist-while-t
        chromeOptions.addArguments("--disable-dev-shm-usage");

        return chromeOptions;
    }

    public void waitForServiceWorkerReady() {
        Assert.assertTrue("Should have navigator.serviceWorker",
                (Boolean) executeScript("return !!navigator.serviceWorker;"));

        // Wait until service worker is ready
        Assert.assertTrue("Should have service worker registered",
                (Boolean) ((JavascriptExecutor) getDriver()).executeAsyncScript(
                        "const done = arguments[arguments.length - 1];"
                                + "const timeout = new Promise("
                                + "  resolve => setTimeout(resolve, 100000)"
                                + ");" + "Promise.race(["
                                + "  navigator.serviceWorker.ready,"
                                + "  timeout])"
                                + ".then(result => done(!!result));"));
    }

    /**
     * Sets the `se:cdp` and `se:cdpVersion` capabilities for the remote web
     * driver. Note that the capabilities are set at runtime because they depend
     * on the session id that becomes only available after the driver is
     * initialized. Without these capabilities, Selenium cannot establish a
     * connection with DevTools.
     */
    private void setDevToolsRuntimeCapabilities(RemoteWebDriver driver,
                                                URL remoteUrl) throws RuntimeException {
        try {
            Field capabilitiesField = RemoteWebDriver.class
                    .getDeclaredField("capabilities");
            capabilitiesField.setAccessible(true);

            String sessionId = driver.getSessionId().toString();
            String devtoolsUrl = String.format("ws://%s:%s/devtools/%s/page",
                    remoteUrl.getHost(), remoteUrl.getPort(), sessionId);

            MutableCapabilities mutableCapabilities = (MutableCapabilities) capabilitiesField
                    .get(driver);
            mutableCapabilities.setCapability("se:cdp", devtoolsUrl);
            mutableCapabilities.setCapability("se:cdpVersion",
                    mutableCapabilities.getBrowserVersion());
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to set DevTools capabilities for RemoteWebDriver");
        }
    }

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
        return "localhost";
    }

    /**
     * If dev server start in progress wait until it's started. Otherwise return
     * immidiately.
     */
    protected void waitForDevServer() {
        Object result;
        do {
            getCommandExecutor().waitForVaadin();
            result = getCommandExecutor().executeScript(
                    "return window.Vaadin && window.Vaadin.Flow && window.Vaadin.Flow.devServerIsNotLoaded;");
        } while (Boolean.TRUE.equals(result));
    }

    @BrowserConfiguration
    public List<DesiredCapabilities> getBrowserConfiguration() {
        return Collections
                .singletonList(Browser.CHROME.getDesiredCapabilities());
    }

    @Override
    protected String getHubURL() {

        String hubUrl = super.getHubURL();
        if (hubUrl.contains("https://ondemand.us-west-1.saucelabs.com/wd/hub")) {
            String username = getSauceUser();
            String accessKey = getSauceAccessKey();

            if (username == null) {
                getLogger().debug("You can give a Sauce Labs user name using -D"
                        + SAUCE_USERNAME_PROP + "=<username> or by "
                        + SAUCE_USERNAME_ENV + " environment variable.");
            }
            if (accessKey == null) {
                getLogger().debug("You can give a Sauce Labs access key using -D"
                        + SAUCE_ACCESS_KEY_PROP + "=<accesskey> or by "
                        + SAUCE_ACCESS_KEY_ENV + " environment variable.");
            }
            return "http://" + username + ":" + accessKey +
                    "@localhost:4445/wd/hub";
        }
        return hubUrl;
    }
}
