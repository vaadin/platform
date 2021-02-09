/*
 * Copyright 2000-2020 Vaadin Ltd.
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
import java.lang.management.ManagementFactory;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.experimental.categories.Category;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.mobile.NetworkConnection;
import org.openqa.selenium.remote.Command;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.remote.Response;

import com.vaadin.testbench.TestBench;
import com.vaadin.testbench.TestBenchDriverProxy;
import com.vaadin.testbench.parallel.Browser;
import com.vaadin.testbench.parallel.ParallelTest;
import com.vaadin.testbench.parallel.setup.RemoteDriver;

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

    static boolean isJavaInDebugMode() {
        return ManagementFactory.getRuntimeMXBean().getInputArguments()
                .toString().contains("jdwp");
    }

    @Before
    @Override
    public void setup() throws Exception {
        ChromeOptions chromeOptions =
                customizeChromeOptions(new ChromeOptions());

        WebDriver driver;
        if (Browser.CHROME == getRunLocallyBrowser()) {
            driver = new ChromeDriver(chromeOptions);
        } else {
            driver = new RemoteDriver().createDriver(getHubURL(), getDesiredCapabilities().merge(chromeOptions));
        }

        setDriver(TestBench.createDriver(driver));
    }

    /**
     * Customizes given Chrome options to enable network connection emulation.
     *
     * @param chromeOptions Chrome options to customize
     * @return customized Chrome options instance
     */
    protected ChromeOptions customizeChromeOptions(ChromeOptions chromeOptions) {
        // Unfortunately using offline emulation ("setNetworkConnection"
        // session command) in Chrome requires the "networkConnectionEnabled"
        // capability, which is:
        //   - Not W3C WebDriver API compliant, so we disable W3C protocol
        //   - device mode: mobileEmulation option with some device settings

        final Map<String, Object> mobileEmulationParams = new HashMap<>();
        mobileEmulationParams.put("deviceName", "Laptop with touch");

        chromeOptions.setExperimentalOption("w3c", false);
        chromeOptions.setExperimentalOption("mobileEmulation",
                mobileEmulationParams);
        chromeOptions.setCapability("networkConnectionEnabled", true);

        
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

    /**
     * Change network connection type in the browser.
     *
     * @param connectionType the new connection type
     * @throws IOException
     */
    protected void setConnectionType(
            NetworkConnection.ConnectionType connectionType)
            throws IOException {
        RemoteWebDriver driver = (RemoteWebDriver) ((TestBenchDriverProxy) getDriver())
                .getWrappedDriver();
        final Map<String, Integer> parameters = new HashMap<>();
        parameters.put("type", connectionType.hashCode());
        final Map<String, Object> connectionParams = new HashMap<>();
        connectionParams.put("parameters", parameters);
        Response response = driver.getCommandExecutor()
                .execute(new Command(driver.getSessionId(),
                        "setNetworkConnection", connectionParams));
        if (response.getStatus() != 0) {
            throw new RuntimeException("Unable to set connection type");
        }
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
                                + ");"
                                + "Promise.race(["
                                + "  navigator.serviceWorker.ready,"
                                + "  timeout])"
                                + ".then(result => done(!!result));"));
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
}
