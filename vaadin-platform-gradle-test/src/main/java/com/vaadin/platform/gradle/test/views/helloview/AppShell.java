package com.vaadin.platform.gradle.test.views.helloview;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.theme.Theme;

/**
 * Use the @PWA annotation make the application installable on phones, tablets
 * and some desktop browsers.
 */
@Theme("gradle-test")
@PWA(name = "Vaadin Platform Gradle Integration Test", shortName = "Platform Gradle IT")
public class AppShell implements AppShellConfigurator {
}
