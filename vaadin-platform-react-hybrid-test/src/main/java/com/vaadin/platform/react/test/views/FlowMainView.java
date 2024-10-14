package com.vaadin.platform.react.test.views;

import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Route;

@Route("flow")
public class FlowMainView extends VerticalLayout {
    public FlowMainView() {
        Span span = new Span("Flow root view for menu!");
        span.setId("flow-main");
        add(span);
    }
}
