package com.vaadin.platform.test;

import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.router.Route;

@Route("OSGi")
public class OsgiCompatibleComponentsView extends Div {
    public OsgiCompatibleComponentsView() {
        Button button = new Button("Button");
        add(button);
    }
}
