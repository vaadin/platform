package com.vaadin.devbundle;

import com.vaadin.flow.component.dependency.StyleSheet;
import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.theme.lumo.Lumo;

@StyleSheet(Lumo.STYLESHEET)
@StyleSheet(Lumo.UTILITY_STYLESHEET)
@PWA(name = "vaadin-dev-bundle", shortName = "vaadin-dev-bundle")
public class FakeAppConf implements AppShellConfigurator{

}
