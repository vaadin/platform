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

import javax.annotation.concurrent.NotThreadSafe;

@NotThreadSafe
public class ComponentsIT extends AbstractPlatformTest {

    static {
        String sauceUser = System.getProperty("sauce.user");
        String browsers = System.getProperty("grid.browsers");
        if (sauceUser != null && !sauceUser.isEmpty()) {
            if (browsers == null || browsers.isEmpty()) {
                Parameters.setGridBrowsers("firefox,safari,edge");
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
            put("vaadin-dialog", () -> {
                $("body").first().click();
                $(ButtonElement.class).id("open-dialog").click();
            });
            put("com.vaadin.flow.component.grid.contextmenu.GridContextMenu", () -> {
                $("body").first().click();
                $(GridElement.class).first().getCell(1, 0).click();
                waitUntil(driver->$("vaadin-context-menu").exists());
            });
            put("com.vaadin.flow.component.grid.contextmenu.GridMenuItem", () -> {
                $("body").first().click();
                $(GridElement.class).first().getCell(1, 0).click();
                waitUntil(driver->$("vaadin-context-menu").exists());
            });
            put("vaadin-login-overlay", () -> {
                $("body").first().click();
                $(ButtonElement.class).id("open-login-overlay").click();
                waitUntil(driver->$("vaadin-login-overlay").exists());
            });
            put("vaadin-context-menu", () -> {
                $("body").first().click();
                $(DivElement.class).id("context-menu-target").click();
                waitUntil(driver->$("vaadin-context-menu").exists());
            });
            put("vaadin-context-menu-item", () -> {
                $("body").first().click();
                $(DivElement.class).id("context-menu-target").click();
                waitUntil(driver->$("vaadin-context-menu").exists());
            });
            put("vaadin-confirm-dialog", () -> {
                $("body").first().click();
                $(ButtonElement.class).id("open-confirm-dialog").click();
            });
        }
    };

    List<String> excludeComponents = Arrays.asList("vaadin-message");

    @Test
    public void appWorks() throws Exception {
        $(NotificationElement.class).waitForFirst();
        new ComponentUsageTest().getTestComponents().forEach(this::checkElement);
    }

    private <T extends TestBenchElement> void checkElement(TestComponent testComponent) {

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

        if("vaadin-login-overlay".equals(tag)){
            $(ButtonElement.class).id("close-login-overlay").click();
            waitUntil(driver -> !$("vaadin-login-overlay").exists());
        }
        $("body").first().click();
    }

    private <T extends TestBenchElement> void checkElement(ElementQuery<T> $) {
        assertTrue($.exists());
        String tagName = $.first().getTagName().toLowerCase();
        if (tagName.contains("-")) {
            assertTrue((Boolean) executeScript("return !!window.customElements.get(arguments[0])", tagName));
        }
    }
}
