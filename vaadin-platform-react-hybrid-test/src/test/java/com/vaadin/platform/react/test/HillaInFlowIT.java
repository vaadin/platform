package com.vaadin.platform.react.test;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

import com.vaadin.flow.component.sidenav.testbench.SideNavItemElement;

public class HillaInFlowIT extends AbstractPlatformTest{

    @Test
    public void hillaViewInFlowLayout() {
        waitUntil(ExpectedConditions.presenceOfElementLocated(By.id("flow-main")));

        // Navigate to Flow view
        $(SideNavItemElement.class).withCaption("Flow in hilla").first().click();

        waitUntil(ExpectedConditions.presenceOfElementLocated(By.id("flow-hilla")));

        Assert.assertNull("Showing hilla placeholder even though Flow should be shown", findElement(By.id("placeholder")));

        // navigate away from Flow view
        $(SideNavItemElement.class).withCaption("React Components").first().click();
    }

    @Override
    protected String getTestPath() {
        return "/flow";
    }
}
