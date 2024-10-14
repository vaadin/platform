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

    @Override
    protected String getTestPath() {
        return "/hilla";
    }
}
