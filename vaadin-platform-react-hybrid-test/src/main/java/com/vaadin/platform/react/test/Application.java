package com.vaadin.platform.react.test;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.PWA;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;

import com.vaadin.flow.server.auth.DefaultMenuAccessControl;
import com.vaadin.flow.server.auth.MenuAccessControl;
import com.vaadin.flow.theme.Theme;

/**
 * The entry point of the Spring Boot application.
 *
 * Use the * and some desktop browsers.
 *
 */
@SpringBootApplication
@Theme(value = "react-test")
@PWA(name = "react-test", shortName = "react-test", offlineResources = {"images/logo.png"})
public class Application extends SpringBootServletInitializer implements AppShellConfigurator {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    public MenuAccessControl customMenuAccessControl() {
        var menuAccessControl = new DefaultMenuAccessControl();
        menuAccessControl.setPopulateClientSideMenu(
                MenuAccessControl.PopulateClientMenu.ALWAYS);
        return menuAccessControl;
    }
}
