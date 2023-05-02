package com.vaadin.devbundle;

import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.component.dependency.NpmPackage;
import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.theme.Theme;

@Theme("vaadin-dev-bundle")
@PWA(name = "vaadin-dev-bundle", shortName = "vaadin-dev-bundle")
@JsModule("@vaadin-component-factory/vcf-nav")
public class FakeAppConf implements AppShellConfigurator{

}
