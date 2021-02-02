package com.vaadin.platform.test;

import static org.junit.Assert.assertTrue;

import java.util.HashMap;

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
        Parameters.setGridBrowsers("firefox,chrome,safari-13,edge");
    }

    @Override
    protected String getTestPath() {
        return "/prod-mode/";
    }

    HashMap<String, Runnable> beforeRuns = new HashMap<String, Runnable>() {
        private static final long serialVersionUID = 1L;
        {
            put("vaadin-confirm-dialog", () -> $(ButtonElement.class).id("open-confirm-dialog").click());
            put("vaadin-dialog", () -> $(ButtonElement.class).id("open-dialog").click());
            put("vaadin-login-overlay", () -> $(ButtonElement.class).id("open-login-overlay").click());
            put("vaadin-context-menu", () -> $(DivElement.class).id("context-menu-target").click());
            put("vaadin-grid-context-menu", () -> $(GridElement.class).first().getCell(1, 0).click());
        }
    };

    @Test
    public void appWorks() throws Exception {

        $(NotificationElement.class).waitForFirst();

        new ComponentUsageTest().getTestComponents().forEach(this::checkElement);
    }

    private <T extends TestBenchElement> void checkElement(TestComponent testComponent) {
        String tag = testComponent.localName != null ? testComponent.localName : testComponent.tag;
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
            System.err.println("NOOO " + testComponent);
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
