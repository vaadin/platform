package com.vaadin.platform.react.test.views;

import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Route;

@Route("flow")
public class FlowMainView extends VerticalLayout {
    public FlowMainView() {
        add(new Span("Flow root view for menu!"));
    }
}
