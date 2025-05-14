package com.vaadin.platform.react.test;


import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.orderedlayout.testbench.VerticalLayoutElement;
import com.vaadin.flow.component.sidenav.testbench.SideNavItemElement;

import static com.vaadin.platform.react.test.views.FlowLayout.LOGIN_BUTTON_ID;

public class HillaMainLayoutIT extends AbstractPlatformTest {

    @Test
    public void anonymousUser_loginButtonAndOnlyAlwaysAllowItems() {
        Assert.assertTrue("Login button should be visible",
                $(ButtonElement.class).id(LOGIN_BUTTON_ID).isDisplayed());
        Assert.assertEquals("Login button should say 'Sign in''",
                $(ButtonElement.class).id(LOGIN_BUTTON_ID).getText(),
                "Sign in");

        Assert.assertEquals("Only one route should be available", 1,
                $(SideNavItemElement.class).all().size());

        Assert.assertTrue("Visible element should be 'Flow Public'",
                getMenuElement("Hello World React").isPresent());
    }

    @Test
    public void loginUser_forAllAndUserViewsAvailable_logout_onlyPublicAvailable() {
        $(ButtonElement.class).id(LOGIN_BUTTON_ID).click();
        login("user", "user");

        // If Login has navigated us to / return to hilla
        if ($(ButtonElement.class).withId("hilla").exists()) {
            $(ButtonElement.class).id("hilla").click();
        }

        Assert.assertEquals(
                "Login button should say 'sign out' as user is logged in",
                "Sign out",
                $(ButtonElement.class).id(LOGIN_BUTTON_ID).getText());

        Assert.assertEquals("Two routes should be available", 2,
                $(SideNavItemElement.class).all().size());

        Assert.assertFalse("Admin view should not be present",
                getMenuElement("Hello Admin").isPresent());

        Assert.assertTrue(
                "User view should be present",
                getMenuElement("Hello User").isPresent());

        // Logout
        ButtonElement loginButton = $(ButtonElement.class).id(LOGIN_BUTTON_ID);
        loginButton.click();

        waitForElement("Root view should be shown after logout." By.id("hilla"))
        Assert.assertEquals("Two buttons should be shown in the root view", 2,
                $(ButtonElement.class).all().size());

        $(ButtonElement.class).id("hilla").click();

        // Wait for page reload that makes the button reference stale.
        waitForElement("No login button found", By.id(LOGIN_BUTTON_ID));

        Assert.assertEquals("Only one route should be available", 1,
                $(SideNavItemElement.class).all().size());

        Assert.assertTrue("Visible element should be 'Flow Public'",
                getMenuElement("Hello World React").isPresent());
    }


    @Test
    public void loginAdmin_forAllAndAdminViewsAvailable() {
        $(ButtonElement.class).id(LOGIN_BUTTON_ID).click();
        login("admin", "admin");

        // If Login has navigated us to / return to hilla
        if ($(ButtonElement.class).withId("hilla").exists()) {
            $(ButtonElement.class).id("hilla").click();
        }

        Assert.assertEquals(
                "Login button should say 'sign out' as user is logged in",
                "Sign out",
                $(ButtonElement.class).id(LOGIN_BUTTON_ID).getText());

        Assert.assertEquals("Two routes should be available", 2,
                $(SideNavItemElement.class).all().size());

        Assert.assertTrue("Admin view should be present",
                getMenuElement("Hello Admin").isPresent());

        Assert.assertFalse(
                "User view should not be present",
                getMenuElement("Hello User").isPresent());

    }

    @Override
    protected String getTestPath() {
        return "/hilla";
    }
}
