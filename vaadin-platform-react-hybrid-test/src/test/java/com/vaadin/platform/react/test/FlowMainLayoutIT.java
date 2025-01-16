package com.vaadin.platform.react.test;

import org.junit.Assert;
import org.junit.Ignore;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.html.testbench.AnchorElement;
import com.vaadin.flow.component.sidenav.testbench.SideNavItemElement;

public class FlowMainLayoutIT extends AbstractPlatformTest {

    @Test
    public void hillaViewInFlowLayout() {
        waitUntil(ExpectedConditions.presenceOfElementLocated(
                By.id("flow-main")));

        // Navigate to Hilla view
        getMenuElement("Hello React in Flow Layout").get().click();

        waitUntil(ExpectedConditions.presenceOfElementLocated(
                By.id("flow-hilla")));

        // navigate away from Hilla view
        getMenuElement("Flow Hello").get().click();

        waitForElement("Should have navigated to HelloWorld Flow",
                By.id("flow-hello"));
    }

    @Test
    public void hillaViewWithFlowOptOut() {
        waitUntil(ExpectedConditions.presenceOfElementLocated(
                By.id("flow-main")));

        // Navigate to Hilla view without Flow layout
        SideNavItemElement helloReactNoFlowLayout = getMenuElement(
                "Hello React NO Flow Layout").get();
        helloReactNoFlowLayout.click();

        waitUntil(ExpectedConditions.presenceOfElementLocated(
                By.id("no-flow-hilla")));

        Assert.assertTrue("No menu should be available for view",
                ExpectedConditions.stalenessOf(helloReactNoFlowLayout)
                        .apply(getDriver()));
    }

    @Test
    public void hillaView_deepTree_FlowLayoutExists() {
        waitUntil(ExpectedConditions.presenceOfElementLocated(
                By.id("flow-main")));

        // Navigate to Hilla view
        getMenuElement("Non root React in Flow").get().click();

        waitUntil(ExpectedConditions.presenceOfElementLocated(
                By.id("flow-hilla-deep-tree")));

        // navigate away from Hilla view
        getMenuElement("Flow Hello").get().click();

        waitForElement("Should have navigated to HelloWorld Flow",
                By.id("flow-hello"));
    }

    @Test
    public void navigateWithRouterLink() {
        waitForElement("Expected flow main view on load",
                By.id("flow-main"));

        $(AnchorElement.class).id("flow-link").click();

        waitForElement("Should have navigated to HelloWorld Flow",
                By.id("flow-hello"));

    }

    @Test
    public void navigateWithUINavigate() {
        waitForElement("Expected flow main view on load",
                By.id("flow-main"));
        $(ButtonElement.class).id("flow-button").click();

        waitForElement("Should have navigated to HelloWorld Flow",
                By.id("flow-hello"));
    }

    @Test
    public void backNavigationTest() {
        waitForElement("Expected flow main view on load",
                By.id("flow-main"));

        // Navigate to Flow view
        getMenuElement("Hello React in Flow Layout").get().click();

        waitForElement("Expected hilla view",
                By.id("flow-hilla"));

        getDriver().navigate().back();

        waitForElement("Expected flow main view for back",
                By.id("flow-main"));

        // navigate away from Flow view
        getMenuElement("Flow Hello").get().click();

        waitForElement("Expected flow view",
                By.id("flow-hello"));

        getDriver().navigate().back();

        waitForElement("Expected flow main view for back",
                By.id("flow-main"));
    }

    @Test
    public void forwardNavigationTest() {
        waitForElement("Expected flow main view on load",
                By.id("flow-main"));

        // Navigate to Flow view
        getMenuElement("Hello React in Flow Layout").get().click();

        waitForElement("Expected hilla view",
                By.id("flow-hilla"));

        // navigate away to Flow view
        getMenuElement("Flow Hello").get().click();

        waitForElement("Expected flow view",
                By.id("flow-hello"));

        getDriver().navigate().back();

        waitForElement("Expected hilla view after back",
                By.id("flow-hilla"));

        getDriver().navigate().back();

        waitForElement("Expected flow main view after second back",
                By.id("flow-main"));

        getDriver().navigate().forward();

        waitForElement("Expected hilla view for forward",
                By.id("flow-hilla"));

        getDriver().navigate().forward();

        waitForElement("Expected flow view for second forward",
                By.id("flow-hello"));
    }

    @Override
    protected String getTestPath() {
        return "/flow";
    }
}
