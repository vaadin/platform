package com.vaadin.platform.react.test;


import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.orderedlayout.testbench.VerticalLayoutElement;

public class HillaMainLayoutIT extends AbstractPlatformTest {

    @Test
    public void flowViewInHillaLayout() {
        Assert.assertNotNull(findElement(By.id("hilla")));

        // Navigate to Flow view
        getMenuElement("Flow in hilla").get().click();

        waitUntil(ExpectedConditions.presenceOfElementLocated(
                By.id("flow-hilla")));

        // navigate away from Flow view
        getMenuElement("React Components").get().click();

        Assert.assertTrue("React components view should be shown",
                $(ButtonElement.class).id("open-overlay").isDisplayed());
    }

    @Test
    public void navigateUsingNavLink() {
        findElement(By.id("toHello")).click();

        Assert.assertTrue("Navigation with NavLink failed.",
                $(VerticalLayoutElement.class).id("HelloReact").isDisplayed());
    }

    @Test
    public void backNavigationTest() {
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
        findElement(By.id("toHello")).click();

        Assert.assertTrue("Navigation with NavLink failed.",
                $(VerticalLayoutElement.class).id("HelloReact").isDisplayed());

        // Navigate to Flow view
        getMenuElement("Flow in hilla").get().click();

        waitForElement("Expected flow view", By.id("flow-hilla"));

        getDriver().navigate().back();
        getDriver().navigate().back();

        Assert.assertTrue("Should have returned to initial page",
                findElement(By.id("toHello")).isDisplayed());

        getDriver().navigate().forward();

        Assert.assertTrue("Expected hilla view after forward",
                $(VerticalLayoutElement.class).id("HelloReact").isDisplayed());

        getDriver().navigate().forward();

        waitForElement("Expected flow view after second forward",
                By.id("flow-hilla"));
    }

    @Override
    protected String getTestPath() {
        return "/hilla";
    }
}
