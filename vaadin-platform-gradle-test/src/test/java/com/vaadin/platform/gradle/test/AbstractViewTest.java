package com.vaadin.platform.gradle.test;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Rule;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.textfield.testbench.TextFieldElement;
import com.vaadin.flow.theme.AbstractTheme;

import com.vaadin.platform.gradle.test.utility.SauceLabsHelper;
import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.ScreenshotOnFailureRule;
import com.vaadin.testbench.TestBench;
import com.vaadin.testbench.parallel.ParallelTest;


/**
 * Base class for TestBench IntegrationTests on chrome.
 * <p>
 * The tests use Chrome driver (see pom.xml for integration-tests profile) to
 * run integration tests on a headless Chrome. If a property {@code test.use
 * .hub} is set to true, {@code AbstractViewTest} will assume that the
 * TestBench test is running in a CI environment. In order to keep the this
 * class light, it makes certain assumptions about the CI environment (such
 * as available environment variables). It is not advisable to use this class
 * as a base class for you own TestBench tests.
 * <p>
 * To learn more about TestBench, visit
 * <a href="https://vaadin.com/docs/testbench/testbench-overview.html">Vaadin TestBench</a>.
 */
public abstract class AbstractViewTest extends ParallelTest {
    private static final int SERVER_PORT = 9998;

    private final String route;
    private final By rootSelector;

    @Rule
    public ScreenshotOnFailureRule rule = new ScreenshotOnFailureRule(this,
            false);

    public AbstractViewTest() {
        this("hello", By.tagName("body"));
    }

    protected AbstractViewTest(String route, By rootSelector) {
        this.route = route;
        this.rootSelector = rootSelector;
    }

    @BeforeClass
    public static void setupClass() {
        WebDriverManager.chromedriver().setup();
    }

    @Before
    public void setup() throws MalformedURLException {

        ChromeOptions chromeOptions =
                customizeChromeOptions(new ChromeOptions());
        WebDriver driver;
        // Always give priority to @RunLocally annotation
        if ((getRunLocallyBrowser() != null)) {
            driver = new ChromeDriver(chromeOptions);
        } else if (Parameters.isLocalWebDriverUsed()) {
            driver = new ChromeDriver(chromeOptions);
        } else if (SauceLabsHelper.isConfiguredForSauceLabs()) {
            driver = new RemoteWebDriver(new URL(getHubURL()),
                    chromeOptions.merge(getDesiredCapabilities()));
        } else if (getRunOnHub(getClass()) != null
                || Parameters.getHubHostname() != null) {
            driver = new RemoteWebDriver(new URL(getHubURL()),
                    chromeOptions.merge(getDesiredCapabilities()));
        } else {
            driver = new ChromeDriver(chromeOptions);
        }

        setDriver(TestBench.createDriver(driver));

        // setDriver(TestBench.createDriver(new ChromeDriver()));

        getDriver().get(getURL(route));
        waitForDevServer();
        waitUntil(drv -> $(ButtonElement.class).all().size() > 0, 30);
        waitUntil(drv -> $(TextFieldElement.class).all().size() > 0, 30);
    }

    /**
     * Convenience method for getting the root element of the view based on
     * the selector passed to the constructor.
     *
     * @return the root element
     */
    protected WebElement getRootElement() {
        return findElement(rootSelector);
    }

    /**
     * Asserts that the given {@code element} is rendered using a theme
     * identified by {@code themeClass}. If the the is not found, JUnit
     * assert will fail the test case.
     *
     * @param element       web element to check for the theme
     * @param themeClass    theme class (such as {@code Lumo.class}
     */
    protected void assertThemePresentOnElement(
            WebElement element, Class<? extends AbstractTheme> themeClass) {
        String themeName = themeClass.getSimpleName().toLowerCase();
        Boolean hasStyle = (Boolean) executeScript("" +
                "var styles = Array.from(arguments[0]._template.content" +
                ".querySelectorAll('style'))" +
                ".filter(style => style.textContent.indexOf('" +
                themeName + "') > -1);" +
                "return styles.length > 0;", element);

        Assert.assertTrue("Element '" + element.getTagName() + "' should have" +
                        " had theme '" + themeClass.getSimpleName() + "'.",
                hasStyle);
    }

    /**
     * Property set to true when running on a test hub.
     */
    private static final String USE_HUB_PROPERTY = "test.use.hub";

    /**
     * Returns deployment host name concatenated with route.
     *
     * @return URL to route
     */
    private static String getURL(String route) {
        return String.format("http://%s:%d/%s", getDeploymentHostname(),
                SERVER_PORT, route);
    }

    /**
     * Returns whether we are using a test hub. This means that the starter
     * is running tests in Vaadin's CI environment, and uses TestBench to
     * connect to the testing hub.
     *
     * @return whether we are using a test hub
     */
    private static boolean isUsingHub() {
        return Boolean.TRUE.toString().equals(
                System.getProperty(USE_HUB_PROPERTY));
    }

    /**
     * If running on CI, get the host name from environment variable HOSTNAME
     *
     * @return the host name
     */
    private static String getDeploymentHostname() {
        return isUsingHub() ? System.getenv("HOSTNAME") : "localhost";
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

    @After
    public void tearDown() {
        if(driver != null) {
            driver.quit();
        }
    }

    protected String getRootURL() {
        return "http://" + getDeploymentHostname() + ":" + getDeploymentPort();
    }

    protected int getDeploymentPort() {
        return SERVER_PORT;
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

        // final Map<String, Object> mobileEmulationParams = new HashMap<>();
        // mobileEmulationParams.put("deviceName", "Laptop with touch");

        // chromeOptions.setExperimentalOption("w3c", false);
        // chromeOptions.setExperimentalOption("mobileEmulation",
        //        mobileEmulationParams);
        // chromeOptions.setCapability("networkConnectionEnabled", true);

        chromeOptions.addArguments("--no-sandbox"); // MUST BE THE VERY FIRST OPTION
        chromeOptions.addArguments("--headless");

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
}
