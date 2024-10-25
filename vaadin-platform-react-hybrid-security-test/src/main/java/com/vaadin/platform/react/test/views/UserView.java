package com.vaadin.platform.react.test.views;

import jakarta.annotation.security.RolesAllowed;

import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Menu;
import com.vaadin.flow.router.Route;
import com.vaadin.platform.react.test.security.Role;

@Route("flow/access/user")
@RolesAllowed(Role.USER)
@Menu(title = "User view")
public class UserView extends VerticalLayout {

    public UserView() {
        add(new Span("User only view"));
    }
}
