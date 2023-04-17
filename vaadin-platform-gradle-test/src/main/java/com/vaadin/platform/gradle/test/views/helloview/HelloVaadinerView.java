package com.vaadin.platform.gradle.test.views.helloview;

import com.vaadin.flow.component.Key;
import com.vaadin.flow.component.Unit;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.charts.Chart;
import com.vaadin.flow.component.charts.model.ChartType;
import com.vaadin.flow.component.charts.model.ListSeries;
import com.vaadin.flow.component.dependency.NpmPackage;
import com.vaadin.flow.component.html.Image;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.Notification.Position;
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
                e -> Notification.show(new GreetService().greet(textField.getValue()),
                        10000, Position.BOTTOM_START));
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

        Chart chart = new Chart(ChartType.LINE);
        chart.setId("chart");
        chart.getElement().getStyle().set("height", "100px");
        chart.getConfiguration().addSeries(new ListSeries(1, 3, 2, 4, 3, 5, 5, 4, 7));
        chart.getElement().getStyle().set("width", "100%");
        chart.getElement().getStyle().set("height", "100%");

        add(textField, button, vaadinSvgIcon, vaadinFontIcon, chart);
    }

}
