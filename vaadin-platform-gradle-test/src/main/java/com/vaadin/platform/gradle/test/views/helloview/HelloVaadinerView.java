package com.vaadin.platform.gradle.test.views.helloview;

import com.vaadin.flow.component.Key;
import com.vaadin.flow.component.Unit;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.dependency.NpmPackage;
import com.vaadin.flow.component.html.Image;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.Route;
import com.vaadin.platform.gradle.test.service.GreetService;

@Route(value = "hello")
@NpmPackage(value = "@fortawesome/fontawesome-free", version = "5.15.1")
public class HelloVaadinerView extends VerticalLayout {

    public static final String TEXT_FIELD_ID = "text-field-id";
    public static final String FONT_AWESOME_ID = "font-awesome";

    public HelloVaadinerView() {
        TextField textField = new TextField("Your name");
        textField.setId(TEXT_FIELD_ID);

        Button button = new Button("Say hello",
                e -> Notification.show(new GreetService().greet(textField.getValue())));
        button.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        button.addClickShortcut(Key.ENTER);

        Image vaadinSvgIcon = new Image(
                "themes/gradle-test/fontawesome/svgs/brands/vaadin.svg",
                "Vaadin Svg Icon");
        vaadinSvgIcon.getStyle().set("margin-top", "5px");
        vaadinSvgIcon.setWidth(35, Unit.PIXELS);
        vaadinSvgIcon.setHeight(35, Unit.PIXELS);

        Span vaadinFontIcon = new Span("  <- Vaadin font-icon is here!");
        vaadinFontIcon.setId(FONT_AWESOME_ID);
        vaadinFontIcon.addClassName("fab");
        vaadinFontIcon.addClassName("fa-vaadin");

        addClassName("centered-content");

        add(textField, button, vaadinSvgIcon, vaadinFontIcon);
    }

}
