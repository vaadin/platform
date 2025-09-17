package com.vaadin.platform.react.test.views;

import jakarta.annotation.security.PermitAll;

import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.router.RouterLink;
import com.vaadin.flow.server.auth.AnonymousAllowed;

@Route("flow")
@AnonymousAllowed
public class FlowMainView extends VerticalLayout {
    public FlowMainView() {
        Span span = new Span("Flow root view for menu!");
        span.setId("flow-main");
        add(span);

        RouterLink flow = new RouterLink("Flow with RouterLink",
                PublicView.class);
        flow.setId("flow-link");

        Button flowButton = new Button("Flow with Button",
                e -> e.getSource().getUI().get()
                        .navigate(PublicView.class));
        flowButton.setId("flow-button");

        add(flow, flowButton);
    }
}
