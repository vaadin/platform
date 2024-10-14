package com.vaadin.platform.react.test;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

import com.vaadin.flow.component.orderedlayout.testbench.HorizontalLayoutElement;
import com.vaadin.flow.component.sidenav.testbench.SideNavItemElement;

public class HillaInFlowIT extends AbstractPlatformTest{

    @Test
    public void hillaViewInFlowLayout() {
        waitUntil(ExpectedConditions.presenceOfElementLocated(By.id("flow-main")));

        // Navigate to Flow view
        getMenuElement("Hello React in Flow Layout").get().click();

        waitUntil(ExpectedConditions.presenceOfElementLocated(By.id("flow-hilla")));

        // navigate away from Flow view
        getMenuElement("Flow Hello").get().click();

       Assert.assertTrue("Flow layout should have been rendered", $(HorizontalLayoutElement.class).first().isDisplayed());
    }

    @Override
    protected String getTestPath() {
        return "/flow";
    }
}
