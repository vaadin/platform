package com.vaadin.platform.test;

import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.confirmdialog.ConfirmDialog;
import com.vaadin.flow.component.datepicker.DatePicker;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.formlayout.FormLayout;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Label;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.ironlist.IronList;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.progressbar.ProgressBar;
import com.vaadin.flow.component.radiobutton.RadioButtonGroup;
import com.vaadin.flow.component.splitlayout.SplitLayout;
import com.vaadin.flow.component.tabs.Tab;
import com.vaadin.flow.component.tabs.Tabs;
import com.vaadin.flow.component.textfield.PasswordField;
import com.vaadin.flow.component.textfield.TextArea;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.component.upload.Upload;
import com.vaadin.flow.router.Route;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import java.util.stream.Stream;

@Route("osgi")
public class OsgiCompatibleComponentsView extends Div {
    public OsgiCompatibleComponentsView() {
        Button button = new Button("Button text");

        Checkbox checkbox = new Checkbox("Checkbox label");

        ComboBox<String> combobox = new ComboBox<>("ComboBox label");
        combobox.setItems("First", "Second", "Third");
        DatePicker datePicker = new DatePicker();

        Grid<Map<String, String>> grid = new Grid<>();
        grid.setWidth("100%");
        grid.addColumn(map -> map.get("foo"));
        grid.addColumn(map -> map.get("bar"));

        List<Map<String, String>> gridItems = new ArrayList<>();
        gridItems.add(map("Some", "Data"));
        gridItems.add(map("Second", "Row"));
        grid.setItems(gridItems);

        HorizontalLayout icons = new HorizontalLayout(
                new Icon(VaadinIcon.VAADIN_H), new Icon(VaadinIcon.VAADIN_V));

        IronList<String> ironList = new IronList<>();
        ironList.setHeight("50px");
        Stream<String> items = IntStream.range(0, 100)
                .mapToObj(i -> ("Item " + i));
        ironList.setItems(items);

        ProgressBar progressBar = new ProgressBar();
        progressBar.setWidth("100%");
        progressBar.setValue(0.7);

        RadioButtonGroup<String> radioButtons = new RadioButtonGroup<>();
        radioButtons
                .setItems(IntStream.range(0, 5).mapToObj(i -> ("Item " + i)));

        TextField textField = new TextField();
        PasswordField passwordField = new PasswordField();

        TextArea textArea = new TextArea();

        Upload upload = new Upload();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        upload.setReceiver((filename, mimeType) -> baos);

        Dialog dialog = new Dialog();
        dialog.add(new Label("This is the contents of the dialog"));
        dialog.open();

        Notification.show("Hello", 30000, Notification.Position.TOP_CENTER);

        // Layouts

        FormLayout formLayout = new FormLayout();
        IntStream.range(0, 6).forEach(i -> formLayout.add(new TextField("FormLayout field " + i)));

        VerticalLayout verticalLayout = new VerticalLayout();
        IntStream.range(0, 3).forEach(i -> verticalLayout
                .add(new Button("VerticalLayout Button " + i)));

        HorizontalLayout horizontalLayout = new HorizontalLayout();
        IntStream.range(0, 3).forEach(i -> horizontalLayout
                .add(new Label("HorizontalLayout Label " + i)));

        SplitLayout splitHorizontal = new SplitLayout(new Button("Left"),
                new Button("Right"));
        SplitLayout splitVertical = new SplitLayout(new Button("Top"),
                new Button("Bottom"));
        splitVertical.setOrientation(SplitLayout.Orientation.VERTICAL);

        Tabs tabs = new Tabs();
        tabs.add(new Tab("foo"), new Tab("bar"));

        ConfirmDialog confirmDialog = new ConfirmDialog();
        confirmDialog.setHeader("Meeting starting");
        confirmDialog.setText("Your next meeting starts in 5 minutes");
        confirmDialog.setConfirmText("OK");
        confirmDialog.open();

        VerticalLayout components = new VerticalLayout();
        VerticalLayout layouts = new VerticalLayout();

        add(new HorizontalLayout(components, layouts));

        components.add(button);
        components.add(checkbox);
        components.add(combobox);
        components.add(datePicker);
        components.add(grid);
        components.add(icons);
        components.add(ironList);
        components.add(progressBar);
        components.add(radioButtons);
        components.add(textField);
        components.add(passwordField);
        components.add(textArea);
        components.add(upload);

        layouts.add(formLayout);
        layouts.add(verticalLayout);
        layouts.add(horizontalLayout);
        layouts.add(splitHorizontal);
        layouts.add(splitVertical);
        layouts.add(tabs);

    }

    private Map<String, String> map(String value1, String value2) {
        Map<String, String> map = new HashMap<>();
        map.put("foo", value1);
        map.put("bar", value2);
        return map;
    }
}
