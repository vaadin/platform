package com.vaadin.platform.react.test.views;

import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.Menu;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;

@Route("flow/public")
@PageTitle("Public View")
@Menu(title = "Flow Public")
@AnonymousAllowed
public class PublicView extends HorizontalLayout {

    private TextField name;
    private Button sayHello;

    public PublicView() {
        setId("flow-hello");
        setPadding(true);
        setSpacing(true);
        name = new TextField("Your name");
        sayHello = new Button("Say hello");
        add(name, sayHello);
        setVerticalComponentAlignment(Alignment.END, name, sayHello);
        sayHello.addClickListener(e -> {
            Notification.show("Hello " + name.getValue());
        });
    }

}
