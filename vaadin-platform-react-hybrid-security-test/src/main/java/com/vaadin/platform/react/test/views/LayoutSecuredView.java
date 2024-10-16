package com.vaadin.platform.react.test.views;

import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;

import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Menu;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.platform.react.test.security.Role;

@Route("flow/access/layout")
@AnonymousAllowed
@Menu(title = "Layout secured")
public class LayoutSecuredView extends VerticalLayout {

    public LayoutSecuredView() {
        add(new Span("Only available with layout access"));
    }
}
