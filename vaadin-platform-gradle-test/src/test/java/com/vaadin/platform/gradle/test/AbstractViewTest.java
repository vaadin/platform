package com.vaadin.platform.gradle.test;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Rule;
import org.openqa.selenium.WebElement;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.textfield.testbench.TextFieldElement;
import com.vaadin.flow.theme.AbstractTheme;
import com.vaadin.testbench.ScreenshotOnFailureRule;
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

    @Rule
    public ScreenshotOnFailureRule rule = new ScreenshotOnFailureRule(this,
            false);

    @BeforeClass
    public static void setupClass() {
        WebDriverManager.chromedriver().setup();
    }

    @Before
    public void setup() throws Exception {
        super.setup();
        getDriver().get(getRootURL() + getTestPath());
        waitForDevServer();
        waitUntil(drv -> $(ButtonElement.class).all().size() > 0, 30);
        waitUntil(drv -> $(TextFieldElement.class).all().size() > 0, 30);
    }

    /**
     * Gets the absolute path to the test, starting with a "/".
     *
     * @return he path to the test, appended to {@link #getRootURL()} for the
     *         full test URL.
     */
    protected abstract String getTestPath();

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

    @After
    public void tearDown() {
        if(driver != null) {
            driver.quit();
        }
    }
}
