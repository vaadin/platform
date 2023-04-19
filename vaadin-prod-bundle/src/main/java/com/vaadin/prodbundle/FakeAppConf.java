package com.vaadin.prodbundle;

import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.component.dependency.NpmPackage;
import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.theme.Theme;

@Theme("vaadin-prod-bundle")
@PWA(name = "vaadin-prod-bundle", shortName = "vaadin-prod-bundle")
@JsModule("@vaadin-component-factory/vcf-nav")
@NpmPackage(value = "@vaadin-component-factory/vcf-nav", version = "1.0.6")
public class FakeAppConf implements AppShellConfigurator{

}
