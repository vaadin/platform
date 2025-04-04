package com.vaadin.platform.react.test.views;

import com.vaadin.flow.component.applayout.AppLayout;
import com.vaadin.flow.component.applayout.DrawerToggle;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.Footer;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Header;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.orderedlayout.Scroller;
import com.vaadin.flow.component.sidenav.SideNav;
import com.vaadin.flow.component.sidenav.SideNavItem;
import com.vaadin.flow.router.Layout;
import com.vaadin.flow.router.RoutePrefix;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.flow.server.menu.MenuConfiguration;
import com.vaadin.flow.spring.security.AuthenticationContext;
import com.vaadin.flow.theme.lumo.LumoUtility;

@Layout("/flow")
@RoutePrefix("flow")
@AnonymousAllowed
public class FlowLayout extends AppLayout {
    public static final String LOGIN_BUTTON_ID = "login-button";
    private final AuthenticationContext authenticationContext;

    private H1 viewTitle;

    public FlowLayout(AuthenticationContext authenticationContext) {
        this.authenticationContext = authenticationContext;
        setPrimarySection(Section.DRAWER);
        addDrawerContent();
        addHeaderContent();
    }

    private void addHeaderContent() {
        DrawerToggle toggle = new DrawerToggle();
        toggle.setAriaLabel("Menu toggle");

        viewTitle = new H1();
        viewTitle.addClassNames(LumoUtility.FontSize.LARGE,
                LumoUtility.Margin.NONE);

        addToNavbar(true, toggle, viewTitle);
    }

    private void addDrawerContent() {
        Span appName = new Span("Flow menu");
        appName.addClassNames(LumoUtility.FontWeight.SEMIBOLD,
                LumoUtility.FontSize.LARGE);
        Header header = new Header(appName);

        Scroller scroller = new Scroller(createNavigation());

        addToDrawer(header, scroller, createFooter());
    }

    private SideNav createNavigation() {
        SideNav nav = new SideNav();

        MenuConfiguration.getMenuEntries().forEach(menuEntry -> {
            if (menuEntry.path().startsWith("flow") ||
                    menuEntry.path().startsWith("/flow")) {
                nav.addItem(
                        new SideNavItem(menuEntry.title(), menuEntry.path()));
            }
        });

        return nav;
    }

    private Footer createFooter() {
        Footer layout = new Footer();
        Button login;

        if (authenticationContext.isAuthenticated()) {
            login = new Button("Logout", e -> {
                authenticationContext.logout();
                e.getSource().getUI().get().getPage().reload();
            });
        } else {
            login = new Button("Sign in",
                    e -> e.getSource().getUI().get().navigate("login"));
        }
        login.setId(LOGIN_BUTTON_ID);
        layout.add(login);

        return layout;
    }

    @Override
    protected void afterNavigation() {
        super.afterNavigation();
        viewTitle.setText(getCurrentPageTitle());
    }

    private String getCurrentPageTitle() {
        return MenuConfiguration.getPageHeader(getContent()).orElse("");
    }
}
