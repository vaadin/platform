package com.vaadin.platform.react.test.views;

import jakarta.annotation.security.RolesAllowed;

import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Menu;
import com.vaadin.flow.router.Route;
import com.vaadin.platform.react.test.security.Role;

@Route("flow/access/admin")
@RolesAllowed(Role.ADMIN)
@Menu(title = "Admin view")
public class AdminView extends VerticalLayout {

    public AdminView() {
        add(new Span("Administator only view"));
    }
}
