package com.vaadin.platform.react.test.views;

import jakarta.annotation.security.RolesAllowed;

import com.vaadin.flow.router.Layout;
import com.vaadin.flow.spring.security.AuthenticationContext;
import com.vaadin.platform.react.test.security.Role;

@Layout("/flow/access")
@RolesAllowed({ Role.USER, Role.ADMIN })
public class AccessLayout extends FlowLayout {

    public AccessLayout(AuthenticationContext authenticationContext) {
        super(authenticationContext);
    }
}
