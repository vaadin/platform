package com.vaadin.devbundle;

import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.component.dependency.NpmPackage;
import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.theme.Theme;

@Theme("vaadin-dev-bundle")
@PWA(name = "vaadin-dev-bundle", shortName = "vaadin-dev-bundle")
@JsModule("@vaadin-component-factory/vcf-nav")
@NpmPackage(value = "line-awesome", version = "1.3.0")
@NpmPackage(value = "@vaadin-component-factory/vcf-nav", version = "1.1.1")
public class FakeAppConf implements AppShellConfigurator{

}
