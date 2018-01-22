/*
 * Copyright 2000-2017 Vaadin Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.vaadin.platform.test;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import com.vaadin.addon.charts.Chart;
import com.vaadin.addon.charts.model.ChartType;
import com.vaadin.addon.charts.model.ListSeries;
import com.vaadin.flow.component.AttachEvent;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.datepicker.DatePicker;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.formlayout.FormLayout;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.html.Label;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcons;
import com.vaadin.flow.component.ironlist.IronList;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.Notification.Position;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.progressbar.ProgressBar;
import com.vaadin.flow.component.radiobutton.RadioButtonGroup;
import com.vaadin.flow.component.splitlayout.SplitLayout;
import com.vaadin.flow.component.splitlayout.SplitLayout.Orientation;
import com.vaadin.flow.component.tabs.Tab;
import com.vaadin.flow.component.tabs.Tabs;
import com.vaadin.flow.component.textfield.PasswordField;
import com.vaadin.flow.component.textfield.TextArea;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.component.upload.Upload;
import com.vaadin.flow.router.Route;

@Route("")
public class ComponentsView extends VerticalLayout {

    private Log log;
    private Dialog dialog;

    public ComponentsView() {
        log = new Log();
        Button button = new Button("Button text", e -> {
            log.log("Clicked button");
        });

        Checkbox checkbox = new Checkbox("Checkbox label");
        log.log("Checkbox default is " + checkbox.getValue());
        checkbox.addValueChangeListener(e -> {
            log.log("Checkbox value changed from '" + e.getOldValue() + "' to '"
                    + e.getValue() + "'");
        });

        ComboBox<String> combobox = new ComboBox<>("ComboBox label");
        combobox.setItems("First", "Second", "Third");
        combobox.addValueChangeListener(e -> {
            log.log("ComboBox value changed from '" + e.getOldValue() + "' to '"
                    + e.getValue() + "'");
        });

        DatePicker datePicker = new DatePicker();
        log.log("DatePicker default is " + datePicker.getValue());
        datePicker.addValueChangeListener(e -> {
            log.log("DatePicker value changed from " + e.getOldValue() + " to "
                    + e.getValue());
        });

        Grid<Map<String, String>> grid = new Grid<>();
        grid.setWidth("100%");
        grid.addColumn(map -> map.get("foo"));
        grid.addColumn(map -> map.get("bar"));
        grid.addSelectionListener(e -> {
            log.log("Grid selection changed to '" + e.getFirstSelectedItem()
                    + "'");
        });

        List<Map<String, String>> gridItems = new ArrayList<>();
        gridItems.add(map("Some", "Data"));
        gridItems.add(map("Second", "Row"));
        grid.setItems(gridItems);

        HorizontalLayout icons = new HorizontalLayout(
                new Icon(VaadinIcons.VAADIN_H), new Icon(VaadinIcons.VAADIN_V));

        IronList<String> ironList = new IronList<>();
        ironList.setHeight("50px");
        Stream<String> items = IntStream.range(0, 100)
                .mapToObj(i -> ("Item " + i));
        ironList.setItems(items);

        ProgressBar progressBar = new ProgressBar();
        progressBar.setWidth("100%");
        progressBar.setValue(0.75d);

        RadioButtonGroup<String> radioButtons = new RadioButtonGroup<>();
        log.log("RadioButtonGroup default is " + radioButtons.getValue());
        radioButtons
                .setItems(IntStream.range(0, 5).mapToObj(i -> ("Item " + i)));
        radioButtons.addValueChangeListener(e -> {
            log.log("RadioButtonGroup value changed from " + e.getOldValue()
                    + " to " + e.getValue());
        });

        TextField textField = new TextField();
        log.log("TextField default is " + textField.getValue());
        textField.addValueChangeListener(e -> {
            log.log("TextField value changed from " + e.getOldValue() + " to "
                    + e.getValue());
        });
        PasswordField passwordField = new PasswordField();
        log.log("PasswordField default is " + passwordField.getValue());
        passwordField.addValueChangeListener(e -> {
            log.log("PasswordField value changed from " + e.getOldValue()
                    + " to " + e.getValue());
        });

        TextArea textArea = new TextArea();
        log.log("TextArea default is " + textArea.getValue());
        textArea.addValueChangeListener(e -> {
            log.log("TextArea value changed from " + e.getOldValue() + " to "
                    + e.getValue());
        });

        Upload upload = new Upload();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        upload.setReceiver((filename, mimetype) -> {
            return baos;
        });
        upload.addSucceededListener(e -> {
            log.log("File of size " + e.getLength() + " received");
        });

        Chart lineChart = new Chart(ChartType.LINE);
        lineChart.getElement().getStyle().set("height", "100px");
        lineChart.getConfiguration()
                .addSeries(new ListSeries(1, 3, 2, 4, 3, 5, 5, 4, 7));

        Chart barChart = new Chart(ChartType.BAR);
        barChart.getConfiguration()
                .addSeries(new ListSeries(1, 3, 2, 4, 3, 5, 5, 4, 7));
        barChart.getElement().getStyle().set("height", "100px");

        dialog = new Dialog();
        dialog.add(new Label("This is the contents of the dialog"));

        // Layouts

        FormLayout formLayout = new FormLayout();
        IntStream.range(0, 6).forEach(i -> {
            formLayout.add(new TextField("FormLayout field " + i));
        });

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
        splitVertical.setOrientation(Orientation.VERTICAL);

        Tabs tabs = new Tabs();
        tabs.add(new Tab("foo"), new Tab("bar"));
        add(log);
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

        components.add(lineChart);
        components.add(barChart);

        layouts.add(formLayout);
        layouts.add(verticalLayout);
        layouts.add(horizontalLayout);
        layouts.add(splitHorizontal);
        layouts.add(splitVertical);
        layouts.add(tabs);

    }

    @Override
    protected void onAttach(AttachEvent attachEvent) {
        super.onAttach(attachEvent);
        // Workaround for https://github.com/vaadin/flow/issues/3279
        dialog.open();
        Notification notification = Notification.show("Hello", 10000,
                Position.TOP_CENTER);
        attachEvent.getUI().add(notification);
    }

    private Map<String, String> map(String value1, String value2) {
        Map<String, String> map = new HashMap<>();
        map.put("foo", value1);
        map.put("bar", value2);
        return map;
    }

}
