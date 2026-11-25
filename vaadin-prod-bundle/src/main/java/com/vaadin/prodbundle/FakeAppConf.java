package com.vaadin.prodbundle;

import com.vaadin.flow.component.dependency.Uses;
import com.vaadin.flow.component.dnd.DragSource;
import com.vaadin.flow.component.dnd.DropTarget;
import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.LoadDependenciesOnStartup;
import com.vaadin.flow.server.PWA;

@PWA(name = "vaadin-prod-bundle", shortName = "vaadin-prod-bundle")
@LoadDependenciesOnStartup(EagerView.class)
// No view uses drag and drop. Naming the classes, rather than the module
// of their connector, also bundles their JavaScript definitions and event data.
@Uses(DragSource.class)
@Uses(DropTarget.class)
public class FakeAppConf implements AppShellConfigurator {

}
