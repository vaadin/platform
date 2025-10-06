package com.vaadin.platform.react.test;


import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.orderedlayout.testbench.VerticalLayoutElement;

public class HillaMainLayoutIT extends AbstractPlatformTest {

    @Test
    public void flowViewInHillaLayout() {
        waitForElement("Page is not ready when this check performs",
                By.id("hilla"));

        // Navigate to Flow view
        getMenuElement("Flow in hilla").get().click();

        waitUntil(ExpectedConditions.presenceOfElementLocated(
                By.id("flow-hilla")));

        // navigate away from Flow view
        getMenuElement("React Components").get().click();

        waitUntil(driver ->
                $(ButtonElement.class).id("open-overlay").isDisplayed());
    }

    @Test
    public void navigateUsingNavLink() {
        waitForElement("Page is not ready when this check performs",
                By.id("toHello"));
        findElement(By.id("toHello")).click();

        waitForElement("Navigation with NavLink failed.",
                By.id("HelloReact"));
    }

    @Test
    public void backNavigationTest() {
        waitForElement("Page is not ready when this check performs",
                By.id("toHello"));
        findElement(By.id("toHello")).click();

        Assert.assertTrue("Navigation with NavLink failed.",
                $(VerticalLayoutElement.class).id("HelloReact").isDisplayed());

        getDriver().navigate().back();

        Assert.assertTrue(
                "Should have returned to initial page from Hilla view",
                findElement(By.id("toHello")).isDisplayed());

        // Navigate to Flow view
        getMenuElement("Flow in hilla").get().click();

        waitForElement("Expected flow view", By.id("flow-hilla"));

        getDriver().navigate().back();

        Assert.assertTrue("Should have returned to initial page from Flow view",
                findElement(By.id("toHello")).isDisplayed());
    }


    @Test
    public void forwardNavigationTest() {
        waitForElement("Page is not ready when this check performs",
                By.id("toHello"));
        findElement(By.id("toHello")).click();

        waitForElement("Navigation with NavLink failed.",
                By.id("HelloReact"));

        // Navigate to Flow view
        getMenuElement("Flow in hilla").get().click();

        waitForElement("Expected flow view", By.id("flow-hilla"));

        getDriver().navigate().back();
        waitForElement("Expected hilla view after forward",
                By.id("HelloReact"));

        getDriver().navigate().back();

        waitForElement("Should have returned to initial page",
                By.id("toHello"));

        getDriver().navigate().forward();

        waitForElement("Expected hilla view after forward",
                By.id("HelloReact"));

        getDriver().navigate().forward();

        waitForElement("Expected flow view after second forward",
                By.id("flow-hilla"));
    }

    @Override
    protected String getTestPath() {
        return "/hilla";
    }

}
