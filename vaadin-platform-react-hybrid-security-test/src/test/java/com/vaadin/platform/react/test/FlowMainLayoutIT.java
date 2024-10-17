package com.vaadin.platform.react.test;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.sidenav.testbench.SideNavItemElement;

import static com.vaadin.platform.react.test.views.FlowLayout.LOGIN_BUTTON_ID;

public class FlowMainLayoutIT extends AbstractPlatformTest {

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
                getMenuElement("Flow Public").isPresent());
    }

    @Test
    public void loginUser_forAllAndUserViewsAvailable_logout_onlyPublicAvailable() {
        $(ButtonElement.class).id(LOGIN_BUTTON_ID).click();
        login("user", "user");

        // If Login has navigated us to / return to Flow
        if ($(ButtonElement.class).withId("flow").exists()) {
            $(ButtonElement.class).id("flow").click();
        }

        Assert.assertEquals(
                "Login button should say 'logout' as user is logged in",
                "Logout", $(ButtonElement.class).id(LOGIN_BUTTON_ID).getText());

        Assert.assertEquals("Four routes should be available", 4,
                $(SideNavItemElement.class).all().size());

        Assert.assertFalse("Admin view should not be present",
                getMenuElement("Admin view").isPresent());

        Assert.assertTrue(
                "Access all view with layout using roles should be available",
                getMenuElement("Layout secured").isPresent());

        // Logout
        $(ButtonElement.class).id(LOGIN_BUTTON_ID).click();

        waitForElement("No login button found", By.id(LOGIN_BUTTON_ID));


        Assert.assertEquals("Only one route should be available", 1,
                $(SideNavItemElement.class).all().size());

        Assert.assertTrue("Visible element should be 'Flow Public'",
                getMenuElement("Flow Public").isPresent());
    }


    @Test
    public void loginAdmin_forAllAndAdminViewsAvailable() {
        $(ButtonElement.class).id(LOGIN_BUTTON_ID).click();
        login("admin", "admin");

        // If Login has navigated us to / return to Flow
        if ($(ButtonElement.class).withId("flow").exists()) {
            $(ButtonElement.class).id("flow").click();
        }

        Assert.assertEquals(
                "Login button should say 'logout' as user is logged in",
                "Logout", $(ButtonElement.class).id(LOGIN_BUTTON_ID).getText());

        Assert.assertEquals("Four routes should be available", 4,
                $(SideNavItemElement.class).all().size());

        Assert.assertTrue("Admin view should be present",
                getMenuElement("Admin view").isPresent());

        Assert.assertFalse("User view should not be present",
                getMenuElement("User view").isPresent());

        Assert.assertTrue(
                "Access all view with layout using roles should be available",
                getMenuElement("Layout secured").isPresent());

        // Logout
        $(ButtonElement.class).id(LOGIN_BUTTON_ID).click();

        waitForElement("No login button found", By.id(LOGIN_BUTTON_ID));


        Assert.assertEquals("Only one route should be available", 1,
                $(SideNavItemElement.class).all().size());

        Assert.assertTrue("Visible element should be 'Flow Public'",
                getMenuElement("Flow Public").isPresent());
    }

    @Override
    protected String getTestPath() {
        return "/flow";
    }
}
