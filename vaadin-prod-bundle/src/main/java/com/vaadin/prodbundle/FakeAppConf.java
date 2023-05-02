package com.vaadin.prodbundle;

import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.component.dependency.NpmPackage;
import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.theme.Theme;

@Theme("vaadin-prod-bundle")
@PWA(name = "vaadin-prod-bundle", shortName = "vaadin-prod-bundle")
public class FakeAppConf implements AppShellConfigurator{

}
