package com.vaadin.platform.test;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.util.Collection;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

import org.junit.Before;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.grid.testbench.GridElement;
import com.vaadin.flow.component.html.testbench.DivElement;
import com.vaadin.flow.component.notification.testbench.NotificationElement;
import com.vaadin.flow.server.Version;
import com.vaadin.platform.test.ComponentUsageTest.TestComponent;
import com.vaadin.testbench.ElementQuery;
import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.TestBenchElement;
import com.vaadin.testbench.commands.TestBenchCommandExecutor;
import com.vaadin.testbench.parallel.ParallelTest;

public class ComponentsIT extends ParallelTest {

    private static Logger log = LoggerFactory.getLogger(ComponentsIT.class);

    static {
        String sauceUser = System.getProperty("sauce.user");
        if (sauceUser != null && !sauceUser.isEmpty()) {
            Parameters.setGridBrowsers(System.getProperty("grid.browsers",
                    "ie11,firefox,chrome,safari-9,safari-10,safari-11,edge,edge-18"));
        }
    }

    @Before
    public void setUp() {
        getDriver().get("http://localhost:8080/prod-mode/");
    }

    private HashMap<String, Runnable> beforeRuns = new HashMap<String, Runnable>() {
        private static final long serialVersionUID = 1L;
        {
            put("vaadin-confirm-dialog", () -> $(ButtonElement.class).id("open-confirm-dialog").click());
            put("vaadin-dialog", () -> $(ButtonElement.class).id("open-dialog").click());
            put("vaadin-login-overlay", () -> $(ButtonElement.class).id("open-login-overlay").click());
            put("vaadin-context-menu", () -> $(DivElement.class).id("context-menu-target").click());
            put("vaadin-context-menu-item", () -> $(DivElement.class).id("context-menu-target").click());
            put("vaadin-grid-context-menu", () -> $(GridElement.class).first().getCell(1, 0).click());
        }
    };

    List<String> excludeComponents = Arrays.asList("vaadin-message");

    private Boolean isBower = false;
    private Boolean isOldBrowser = false;
    @Test
    @SuppressWarnings("unchecked")
    public void appWorks() throws Exception {
        // wait until notification is available
        $(NotificationElement.class).waitForFirst(120);

        TestBenchCommandExecutor executor = $("html").first().getCommandExecutor();
        List<String> registered = (List<String>) executor.executeScript("return Vaadin.registrations.map(function(c) {return c.is});");

        isBower = (Boolean) executor.executeScript("return !!window.Vaadin.Lumo");
        Boolean isLTS = Version.getMajorVersion() < 15;
        isOldBrowser = currentBrowser().matches("safari-9|safari-10|ie11.*");

        Collection<TestComponent> allComponents = new ComponentUsageTest().getTestComponents();
        Collection<TestComponent> registeredComponents = allComponents.stream().filter(c -> registered.contains(c.localName)).collect(Collectors.toList());

        log.info("Running component test for browser={}, bower={}, lts={}, oldBrowser={}", currentBrowser(), isBower, isLTS, isOldBrowser);
        if (isOldBrowser && (isBower || isLTS)) {
            registeredComponents.forEach(this::checkElement);
        } else {
            allComponents.stream().filter(c ->
              // TODO: investigate why when `vaadin-grid-flow-selection-column` fails in IE11 and safari
              isOldBrowser && c.localName.matches("vaadin-grid-flow-selection-column")
            ).forEach(this::checkElement);
        }
        log.info("Tests succeed for={}, bower={}, lts={}, oldBrowser=", currentBrowser(), isBower, isLTS, isOldBrowser);
    }

    String currentBrowser() {
        String v = getDesiredCapabilities().getVersion();
        return getDesiredCapabilities().getBrowserName() + (v != null && !v.isEmpty() ? "-" + v : "");
    }

    private <T extends TestBenchElement> void checkElement(TestComponent testComponent) {
        String tag = testComponent.localName != null ? testComponent.localName : testComponent.tag;
        if (beforeRuns.containsKey(tag)) {
            beforeRuns.get(tag).run();
        }

        if (excludeComponents.contains(tag)) {
            return;
        }

        ElementQuery<? extends TestBenchElement> $ = null;
        if (testComponent.tbElement != null) {
            $ = $(testComponent.tbElement);
        }
        if (($  == null || !$.exists()) && tag != null) {
            $ = $(tag);
        }

        checkElement($, tag);
    }

    private <T extends TestBenchElement> void checkElement(ElementQuery<T> $, String tag) {

        assertTrue(tag + " not found in the view for " + currentBrowser(), $ != null && $.exists());

        assertNotNull(tag + " first is null " + currentBrowser(), $.first());

        String tagName = $.first().getTagName();;
        assertNotNull(tag + " getTagName is null " + currentBrowser(), tagName);

        assertTrue(tag + " not equal to " + tagName + " " + currentBrowser(),
                tagName != null && tag.equals(tagName.toLowerCase()));

        assertTrue(tag + " customElement not registered for " + currentBrowser(), !tag.contains("-")
                || (Boolean) executeScript("return !!window.customElements.get(arguments[0])", tagName));
    }
}
