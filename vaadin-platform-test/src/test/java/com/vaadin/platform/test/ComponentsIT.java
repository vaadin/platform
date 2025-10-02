package com.vaadin.platform.test;

import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import com.vaadin.flow.component.login.testbench.LoginOverlayElement;
import org.junit.Test;
import org.openqa.selenium.Keys;
import org.openqa.selenium.interactions.Actions;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.confirmdialog.testbench.ConfirmDialogElement;
import com.vaadin.flow.component.grid.testbench.GridElement;
import com.vaadin.flow.component.html.testbench.DivElement;
import com.vaadin.flow.component.notification.testbench.NotificationElement;
import com.vaadin.platform.test.ComponentUsageTest.TestComponent;
import com.vaadin.testbench.ElementQuery;
import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.TestBenchElement;
import com.vaadin.testbench.parallel.SauceLabsIntegration;

public class ComponentsIT extends AbstractPlatformTest {

    static {
        if (SauceLabsIntegration.isConfiguredForSauceLabs()) {
            String browsers = System.getProperty("grid.browsers");
            if (browsers == null || browsers.isEmpty()) {
                // supported broswers : firefox esr is 128
                Parameters.setGridBrowsers("firefox,firefox-128,safari-17,edge");
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
            put("com.vaadin.flow.component.grid.contextmenu.GridContextMenu", () -> {
                $(GridElement.class).first().getCell(1, 1).click();
                waitUntil(driver->$("vaadin-context-menu").exists());
            });
            put("com.vaadin.flow.component.grid.contextmenu.GridMenuItem", () -> {
                $(GridElement.class).first().getCell(1, 1).click();
                waitUntil(driver->$("vaadin-context-menu").exists());
            });
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

        new ComponentUsageTest().getTestComponents().forEach(this::checkElement);
    }

    private <T extends TestBenchElement> void checkElement(TestComponent testComponent) {
        // Make sure that we close any modal dialog before each iteration
        new Actions(getDriver()).sendKeys(Keys.ESCAPE).build().perform();

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

        if ($(ConfirmDialogElement.class).exists()){
            ConfirmDialogElement dialogElement = $(ConfirmDialogElement.class).waitForFirst();
            dialogElement.getConfirmButton().click();
        }

        // The component uses strict modality now, so prevents updates from the client.
        // So we need to close the overlay before next test step
        if ($(LoginOverlayElement.class).exists()){
            LoginOverlayElement loginOverlayElement = $(LoginOverlayElement.class).waitForFirst();
            loginOverlayElement.getForgotPasswordButton().click();
        }
    }

    private <T extends TestBenchElement> void checkElement(ElementQuery<T> $) {
        assertTrue($.exists());
        String tagName = $.first().getTagName().toLowerCase();
        if (tagName.contains("-")) {
            assertTrue((Boolean) executeScript("return !!window.customElements.get(arguments[0])", tagName));
        }
    }
}
