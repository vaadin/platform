package com.vaadin.prodbundle;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.LoadDependenciesOnStartup;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.theme.Theme;

@Theme("vaadin-prod-bundle")
@PWA(name = "vaadin-prod-bundle", shortName = "vaadin-prod-bundle")
@LoadDependenciesOnStartup(EagerView.class)
public class FakeAppConf implements AppShellConfigurator {

}
