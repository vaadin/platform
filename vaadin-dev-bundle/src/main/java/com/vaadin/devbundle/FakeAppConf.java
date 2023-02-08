package com.vaadin.devbundle;

import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.component.dependency.NpmPackage;
import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.theme.Theme;

@Theme("vaadin-dev-bundle")
@JsModule("@vaadin-component-factory/vcf-nav")
@NpmPackage(value = "line-awesome", version = "1.3.0")
@NpmPackage(value = "@vaadin-component-factory/vcf-nav", version = "1.0.6")
@NpmPackage(value = "@vaadin/bundles", version = "%bundles.version%")
@NpmPackage(value = "@vaadin/component-base", version = "%component.base.version%")
@NpmPackage(value = "@vaadin/field-base", version = "%field.base.version%")
@NpmPackage(value = "@vaadin/input-container", version = "%input.container.version%")
@NpmPackage(value = "@vaadin/lit-renderer", version = "%lit.renderer.version%")
@NpmPackage(value = "@vaadin/overlay", version = "%overlay.version%")
@NpmPackage(value = "@vaadin/vaadin-development-mode-detector", version = "%devmode.detector.version%")
@NpmPackage(value = "@vaadin/vaadin-usage-statistics", version = "%statistics.version%")
public class FakeAppConf implements AppShellConfigurator{

}
