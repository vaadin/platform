package com.vaadin.platform.react.test;

import java.util.List;
import java.util.Optional;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.sidenav.testbench.SideNavElement;
import com.vaadin.flow.component.sidenav.testbench.SideNavItemElement;

public class FlowInHillaIT extends AbstractPlatformTest{

    @Test
    public void flowViewInHillaLayout() {
        Assert.assertNotNull(findElement(By.id("hilla")));

        // Navigate to Flow view
        getMenuElement("Flow in hilla").get().click();

        waitUntil(ExpectedConditions.presenceOfElementLocated(By.id("flow-hilla")));

        // navigate away from Flow view
        getMenuElement("React Components").get().click();

        Assert.assertTrue("React components view should be shown", $(ButtonElement.class).id("open-overlay").isDisplayed());
    }

    @Override
    protected String getTestPath() {
        return "/hilla";
    }
}
