package com.vaadin.platform.test;

import static org.junit.Assert.assertTrue;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

import org.junit.Before;
import org.junit.Test;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.grid.GridSelectionColumn;
import com.vaadin.flow.component.grid.testbench.GridElement;
import com.vaadin.flow.component.html.testbench.DivElement;
import com.vaadin.flow.component.notification.testbench.NotificationElement;
import com.vaadin.platform.test.ComponentUsageTest.TestComponent;
import com.vaadin.testbench.ElementQuery;
import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.TestBenchElement;
import com.vaadin.testbench.commands.TestBenchCommandExecutor;
import com.vaadin.testbench.parallel.ParallelTest;

public class ComponentsIT extends ParallelTest {

    static {
        Parameters.setGridBrowsers(
                "ie11,firefox,chrome,safari-9,safari-10,safari-11,edge,edge-18");
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

    @Test
    @SuppressWarnings("unchecked")
    public void appWorks() throws Exception {
        System.err.println(">> Running component tests for: " + currentBrowser());

        // wait until notification is available
        $(NotificationElement.class).waitForFirst(120);

        TestBenchCommandExecutor executor = $("html").first().getCommandExecutor();
        Boolean isBower = (Boolean) executor.executeScript("return !!window.Vaadin.Lumo");
        List<String> registered = (List<String>) executor.executeScript("return Vaadin.registrations.map(c => c.is)");

        Collection<TestComponent> allComponents = new ComponentUsageTest().getTestComponents();
        Collection<TestComponent> registeredComponents = allComponents.stream().filter(c -> registered.contains(c.localName)).collect(Collectors.toList());
        if (isBower) {
            registeredComponents.forEach(this::checkElement);
        } else {
            allComponents.forEach(this::checkElement);
        }
        System.err.println(">> Tests succeed for: " + currentBrowser());
    }

    String currentBrowser() {
        return getDesiredCapabilities().getBrowserName() + "-" + getDesiredCapabilities().getVersion();
    }

    private <T extends TestBenchElement> void checkElement(TestComponent testComponent) {
        if ("safari-10".equals(currentBrowser())) {
            return;
        }

        if ("safari-9".equals(currentBrowser()) && GridSelectionColumn.class.equals(testComponent.component)) {
            return;
        }
        String tag = testComponent.localName != null ? testComponent.localName : testComponent.tag;
        System.err.println("  >> Running test for: " + tag + " " + currentBrowser());
        if (beforeRuns.containsKey(tag)) {
            beforeRuns.get(tag).run();
        }

        ElementQuery<? extends TestBenchElement> $ = null;
        if (testComponent.tbElement != null) {
            $ = $(testComponent.tbElement);
        }
        if (($  == null || !$.exists()) && tag != null) {
            $ = $(tag);
        }
        if (($  == null || !$.exists())) {
            System.err.println(" >> Component not found in the View" + testComponent + " " + currentBrowser());
        }
        checkElement($, tag);
    }

    private <T extends TestBenchElement> void checkElement(ElementQuery<T> $, String tag) {
        assertTrue(tag + " not found.",  $.exists());
        String tagName = $.first().getTagName().toLowerCase();
        if (tagName.contains("-")) {
            assertTrue((Boolean) executeScript("return !!window.customElements.get(arguments[0])", tagName));
        }
    }
}
