package com.vaadin.platform.test;

import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import org.junit.Test;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.grid.testbench.GridElement;
import com.vaadin.flow.component.html.testbench.DivElement;
import com.vaadin.flow.component.notification.testbench.NotificationElement;
import com.vaadin.platform.test.ComponentUsageTest.TestComponent;
import com.vaadin.testbench.ElementQuery;
import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.TestBenchElement;

public class ComponentsIT extends AbstractPlatformTest {

    static {
        String sauceUser = System.getProperty("sauce.user");
        String browsers = System.getProperty("grid.browsers");
        if (sauceUser != null && !sauceUser.isEmpty()) {
            if (browsers == null || browsers.isEmpty()) {
                Parameters.setGridBrowsers("firefox,chrome,safari,edge");
            } else {
                Parameters.setGridBrowsers(browsers);
            }
        }
    }

    @Override
    protected String getTestPath() {
        return "/prod-mode/";
    }


    HashMap<String, Runnable> beforeRunsByTag = new HashMap<String, Runnable>() {
        private static final long serialVersionUID = 1L;
        {
            put("com.vaadin.flow.component.grid.contextmenu.GridContextMenu", () -> $(GridElement.class).first().getCell(1, 0).click());
            put("com.vaadin.flow.component.grid.contextmenu.GridMenuItem", () -> $(GridElement.class).first().getCell(1, 0).click());
            put("vaadin-confirm-dialog", () -> $(ButtonElement.class).id("open-confirm-dialog").click());
            put("vaadin-dialog", () -> $(ButtonElement.class).id("open-dialog").click());
            put("vaadin-login-overlay", () -> $(ButtonElement.class).id("open-login-overlay").click());
            put("vaadin-context-menu", () -> $(DivElement.class).id("context-menu-target").click());
            put("vaadin-context-menu-item", () -> $(DivElement.class).id("context-menu-target").click());
        }
    };

    List<String> excludeComponents = Arrays.asList("vaadin-message");

    @Test
    public void appWorks() throws Exception {
        $(NotificationElement.class).waitForFirst();

        new ComponentUsageTest().getTestComponents().forEach(testComponent -> {
            String tag = testComponent.localName != null ? testComponent.localName : testComponent.tag;
            String className = testComponent.component != null ? testComponent.component.getName() : null;
            if (!beforeRunsByTag.containsKey(tag) && !beforeRunsByTag.containsKey(className)) {
                checkElement(testComponent);
            }
        });
    }

    @Test
    public void appWorksWithAction() throws Exception {
        $(NotificationElement.class).waitForFirst();
        new ComponentUsageTest().getTestComponents().forEach(testComponent -> {
            String tag = testComponent.localName != null ? testComponent.localName : testComponent.tag;
            String className = testComponent.component != null ? testComponent.component.getName() : null;

            List<String> exclusion = Arrays.asList("vaadin-login-overlay",
                    "com.vaadin.flow.component.grid.contextmenu.GridContextMenu",
                    "com.vaadin.flow.component.grid.contextmenu.GridMenuItem");
            if (!(exclusion.contains(tag) || exclusion.contains(className)) && (beforeRunsByTag.containsKey(tag) || beforeRunsByTag.containsKey(className))) {
                checkElement(testComponent);
            }
        });
    }

    @Test
    public void appWorksWithActionOnLoginOverlay() throws Exception {
        $(NotificationElement.class).waitForFirst();
        new ComponentUsageTest().getTestComponents().forEach(testComponent -> {
            String tag = testComponent.localName != null ? testComponent.localName : testComponent.tag;
            if (tag == "vaadin-login-overlay") {
                checkElement(testComponent);
            }
        });
    }

    @Test
    public void appWorksWithActionOnGridContextMenu() throws Exception {
        $(NotificationElement.class).waitForFirst();
        new ComponentUsageTest().getTestComponents().forEach(testComponent -> {
            String className = testComponent.component != null ? testComponent.component.getName() : null;
            if (className == "com.vaadin.flow.component.grid.contextmenu.GridContextMenu" ) {
                checkElement(testComponent);
            }
        });
    }

    @Test
    public void appWorksWithActionOnGridMenuItem() throws Exception {
        $(NotificationElement.class).waitForFirst();
        new ComponentUsageTest().getTestComponents().forEach(testComponent -> {
            String className = testComponent.component != null ? testComponent.component.getName() : null;
            if (className == "com.vaadin.flow.component.grid.contextmenu.GridMenuItem" ) {
                checkElement(testComponent);
            }
        });
    }

    private <T extends TestBenchElement> void checkElement(TestComponent testComponent) {
        // Make sure that we close any modal dialog before each iteration
        $("body").first().click();

        String tag = testComponent.localName != null ? testComponent.localName : testComponent.tag;
        String className = testComponent.component != null ? testComponent.component.getName() : null;

        Runnable run = beforeRunsByTag.get(className);
        if (beforeRunsByTag.containsKey(tag) || beforeRunsByTag.containsKey(className)) {

            if (run == null) {
                run = beforeRunsByTag.get(tag);
            }
            if (run != null) {
                run.run();
            }
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
        if (($  == null || !$.exists())) {
            System.err.println(">>> Component not found in the View\n" + testComponent);
        }
        checkElement($);
    }

    private <T extends TestBenchElement> void checkElement(ElementQuery<T> $) {
        assertTrue($.exists());
        String tagName = $.first().getTagName().toLowerCase();
        if (tagName.contains("-")) {
            assertTrue((Boolean) executeScript("return !!window.customElements.get(arguments[0])", tagName));
        }
    }
}
