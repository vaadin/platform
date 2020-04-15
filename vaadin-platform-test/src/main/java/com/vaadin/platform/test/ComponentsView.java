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

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import org.apache.commons.io.IOUtils;

import com.vaadin.flow.component.accordion.Accordion;
import com.vaadin.flow.component.applayout.AppLayout;
import com.vaadin.flow.component.board.Board;
import com.vaadin.flow.component.board.Row;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.charts.Chart;
import com.vaadin.flow.component.charts.model.ChartType;
import com.vaadin.flow.component.charts.model.ListSeries;
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.checkbox.CheckboxGroup;
import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.confirmdialog.ConfirmDialog;
import com.vaadin.flow.component.contextmenu.ContextMenu;
import com.vaadin.flow.component.cookieconsent.CookieConsent;
import com.vaadin.flow.component.crud.BinderCrudEditor;
import com.vaadin.flow.component.crud.Crud;
import com.vaadin.flow.component.customfield.CustomField;
import com.vaadin.flow.component.datepicker.DatePicker;
import com.vaadin.flow.component.datetimepicker.DateTimePicker;
import com.vaadin.flow.component.details.Details;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.formlayout.FormLayout;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.grid.contextmenu.GridContextMenu;
import com.vaadin.flow.component.gridpro.GridPro;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Label;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.ironlist.IronList;
import com.vaadin.flow.component.listbox.ListBox;
import com.vaadin.flow.component.login.LoginForm;
import com.vaadin.flow.component.menubar.MenuBar;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.Notification.Position;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.progressbar.ProgressBar;
import com.vaadin.flow.component.radiobutton.RadioButtonGroup;
import com.vaadin.flow.component.richtexteditor.RichTextEditor;
import com.vaadin.flow.component.select.Select;
import com.vaadin.flow.component.splitlayout.SplitLayout;
import com.vaadin.flow.component.splitlayout.SplitLayout.Orientation;
import com.vaadin.flow.component.tabs.Tab;
import com.vaadin.flow.component.tabs.Tabs;
import com.vaadin.flow.component.textfield.PasswordField;
import com.vaadin.flow.component.textfield.TextArea;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.component.timepicker.TimePicker;
import com.vaadin.flow.component.upload.Upload;
import com.vaadin.flow.component.upload.receivers.MemoryBuffer;
import com.vaadin.flow.data.binder.Binder;
import com.vaadin.flow.data.value.ValueChangeMode;
import com.vaadin.flow.internal.MessageDigestUtil;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.theme.Theme;
import com.vaadin.flow.theme.lumo.Lumo;

@Route("")
@Theme(Lumo.class)
public class ComponentsView extends VerticalLayout {

    private Log log;

    public ComponentsView() {
        log = new Log();
        Button button = new Button("Button text", e -> {
            log.log("Clicked button");
        });
        button.setId("button");

        Checkbox checkbox = new Checkbox("Checkbox label");
        log.log("Checkbox default is " + checkbox.getValue());
        checkbox.addValueChangeListener(e -> {
            log.log("Checkbox value changed from '" + e.getOldValue() + "' to '"
                    + e.getValue() + "'");
        });
        checkbox.setId("checkbox");

        CheckboxGroup<String> checkboxGroup = new CheckboxGroup<>();
        checkboxGroup.setItems("foo", "bar");
        checkboxGroup.addValueChangeListener(event -> log
                .log("CheckboxGroup value changed from '" + event.getOldValue()
                        + "' to '" + event.getValue() + "'"));
        checkboxGroup.setId("checkboxgroup");

        ComboBox<String> combobox = new ComboBox<>("ComboBox label");
        combobox.setItems("First", "Second", "Third");
        combobox.addValueChangeListener(e -> {
            log.log("ComboBox value changed from '" + e.getOldValue() + "' to '"
                    + e.getValue() + "'");
        });
        combobox.setId("combobox");

        DatePicker datePicker = new DatePicker();
        log.log("DatePicker default is " + datePicker.getValue());
        datePicker.addValueChangeListener(e -> {
            log.log("DatePicker value changed from " + e.getOldValue() + " to "
                    + e.getValue());
        });
        datePicker.setId("datepicker");

        DateTimePicker dateTimePicker = new DateTimePicker();
        log.log("DateTimePicker default is " + dateTimePicker.getValue());
        dateTimePicker.addValueChangeListener(e -> {
            log.log("DateTimePicker value changed from " + e.getOldValue() + " to "
                    + e.getValue());
        });
        dateTimePicker.setId("dateTimePicker");

        TimePicker timePicker = new TimePicker();
        log.log("TimePicker default is " + timePicker.getValue());
        timePicker.addValueChangeListener(e -> {
            log.log("TimePicker value changed from " + e.getOldValue() + " to "
                    + e.getValue());
        });
        timePicker.setId("timepicker");

        Select<String> select = new Select<>();
        select.setItems("Spring", "Summer", "Autumn", "Winter");
        log.log("Select default is " + select.getValue());
        select.addValueChangeListener(e -> {
            log.log("Select value changed from " + e.getOldValue() + " to "
                    + e.getValue());
        });
        select.setId("select");

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
        grid.setId("grid");

        GridContextMenu<Map<String, String>> gridContextMenu = grid
                .addContextMenu();
        gridContextMenu.addItem("foo", e -> e.getItem().ifPresent(
                item -> log.log("GridContextMenu on item " + item.get("foo"))));
        gridContextMenu.setOpenOnClick(true);
        gridContextMenu.setId("gridcontextmenu");

        HorizontalLayout icons = new HorizontalLayout(
                new Icon(VaadinIcon.VAADIN_H), new Icon(VaadinIcon.VAADIN_V));

        IronList<String> ironList = new IronList<>();
        ironList.setHeight("50px");
        Stream<String> items = IntStream.range(0, 100)
                .mapToObj(i -> ("Item " + i));
        ironList.setItems(items);
        ironList.setId("ironlist");

        ListBox<String> listBox = new ListBox<>();
        listBox.setItems(IntStream.range(0, 7).mapToObj(i -> ("Item " + i)));
        Div listBoxComponent = new Div();
        listBoxComponent.setId("list-box-component");
        listBoxComponent.setText("One more item as a component");
        listBox.addValueChangeListener(event -> log
                .log("ListBox value changed from '" + event.getOldValue()
                        + "' to '" + event.getValue() + "'"));
        listBox.add(listBoxComponent);
        listBox.setId("listbox");

        ProgressBar progressBar = new ProgressBar();
        progressBar.setWidth("100%");
        progressBar.setValue(0.7);
        progressBar.setId("progressbar");

        RadioButtonGroup<String> radioButtons = new RadioButtonGroup<>();
        log.log("RadioButtonGroup default is " + radioButtons.getValue());
        radioButtons
                .setItems(IntStream.range(0, 5).mapToObj(i -> ("Item " + i)));
        radioButtons.addValueChangeListener(e -> {
            log.log("RadioButtonGroup value changed from " + e.getOldValue()
                    + " to " + e.getValue());
        });
        radioButtons.setId("radiobuttongroup");

        TextField textField = new TextField();
        textField.setValueChangeMode(ValueChangeMode.EAGER);
        log.log("TextField default is " + textField.getValue());
        textField.addValueChangeListener(e -> {
            log.log("TextField value changed from " + e.getOldValue() + " to "
                    + e.getValue());
        });
        textField.setId("textfield");

        PasswordField passwordField = new PasswordField();
        passwordField.setValueChangeMode(ValueChangeMode.EAGER);
        log.log("PasswordField default is " + passwordField.getValue());
        passwordField.addValueChangeListener(e -> {
            log.log("PasswordField value changed from " + e.getOldValue()
                    + " to " + e.getValue());
        });
        passwordField.setId("passwordfield");

        TextArea textArea = new TextArea();
        textArea.setValueChangeMode(ValueChangeMode.EAGER);
        log.log("TextArea default is " + textArea.getValue());
        textArea.addValueChangeListener(e -> {
            log.log("TextArea value changed from " + e.getOldValue() + " to "
                    + e.getValue());
        });
        textArea.setId("textarea");

        MemoryBuffer buffer = new MemoryBuffer();
        Upload upload = new Upload(buffer);
        upload.addSucceededListener(
                event -> handleUploadedFile(event.getMIMEType(),
                        event.getMIMEType(), buffer.getInputStream()));
        upload.setId("upload");

        Dialog dialog = new Dialog();
        dialog.add(new Label("This is the contents of the dialog"));
        Button dialogButton = new Button("open Dialog", event -> dialog.open());
        dialogButton.setId("open-dialog");
        dialog.setId("dialog");

        Notification.show("Hello", 2000000, Position.TOP_CENTER);

        // Layouts

        FormLayout formLayout = new FormLayout();
        IntStream.range(0, 6).forEach(i -> {
            formLayout.add(new TextField("FormLayout field " + i));
        });
        formLayout.setId("formlayout");

        VerticalLayout verticalLayout = new VerticalLayout();
        verticalLayout.setId("verticallayout");
        IntStream.range(0, 3).forEach(i -> verticalLayout
                .add(new Button("VerticalLayout Button " + i)));

        HorizontalLayout horizontalLayout = new HorizontalLayout();
        horizontalLayout.setId("horizontallayout");
        IntStream.range(0, 3).forEach(i -> horizontalLayout
                .add(new Label("HorizontalLayout Label " + i)));

        SplitLayout splitHorizontal = new SplitLayout(new Button("Left"),
                new Button("Right"));
        splitHorizontal.getStyle().set("flex", "none");
        splitHorizontal.setId("splithorizontal");

        SplitLayout splitVertical = new SplitLayout(new Button("Top"),
                new Button("Bottom"));
        splitVertical.setOrientation(Orientation.VERTICAL);
        splitVertical.getStyle().set("flex", "none");
        splitVertical.setId("splitvertical");

        Tabs tabs = new Tabs();
        tabs.add(new Tab("foo"), new Tab("bar"));
        tabs.addSelectedChangeListener(event -> log.log(
                "Tabs selected index changed to " + tabs.getSelectedIndex()));
        tabs.setId("tabs");

        Div contextMenuTarget = new Div();
        contextMenuTarget.setText("Context Menu Target");
        contextMenuTarget.setId("context-menu-target");
        ContextMenu menu = new ContextMenu(contextMenuTarget);
        menu.setId("the-context-menu");
        menu.setOpenOnClick(true);
        menu.addItem(new Span("Item 0"),
                event -> log.log("Context menu Item 0 is clicked"));
        menu.addItem(new Span("Item 1"),
                event -> log.log("Context menu Item 1 is clicked"));
        add(log);

        Board board = new Board();
        board.setId("board");
        Label header = new Label("This is a board");
        header.getElement().getStyle().set("background-color", "lightblue");
        header.getElement().getStyle().set("text-align", "center");
        header.setWidth("100%");
        Row row = new Row(header);
        row.setComponentSpan(header, 4);
        row.setId("row");

        Chart lineChart = new Chart(ChartType.LINE);
        lineChart.setId("chart");
        lineChart.getElement().getStyle().set("height", "100px");
        lineChart.getConfiguration()
                .addSeries(new ListSeries(1, 3, 2, 4, 3, 5, 5, 4, 7));
        lineChart.getElement().getStyle().set("width", "100%");
        lineChart.getElement().getStyle().set("height", "100%");
        Chart barChart = new Chart(ChartType.BAR);
        barChart.getConfiguration()
                .addSeries(new ListSeries(1, 3, 2, 4, 3, 5, 5, 4, 7));
        barChart.getElement().getStyle().set("height", "100%");
        barChart.getElement().getStyle().set("width", "100%");

        Row row2 = new Row(lineChart, barChart);
        row2.setComponentSpan(lineChart, 2);
        row2.setComponentSpan(barChart, 2);

        board.add(row, row2);

        ConfirmDialog confirmDialog = new ConfirmDialog();
        confirmDialog.setHeader("Meeting starting");
        confirmDialog.setText("Your next meeting starts in 5 minutes");
        confirmDialog.setConfirmText("OK");
        Button confirmDialogButton = new Button("open confirm Dialog", event -> confirmDialog.open());
        confirmDialogButton.setId("open-confirm-dialog");
        confirmDialog.setId("confirmdialog");

        CookieConsent cookieConsent = new CookieConsent();
        cookieConsent.setId("cookieconsent");

        AppLayout appLayout = new AppLayout();
        appLayout.setId("applayout");

        Crud<Entity> crud = new Crud<>(Entity.class, new BinderCrudEditor<>(
                new Binder<>(Entity.class), new HorizontalLayout()));
        crud.setId("crud");

        GridPro<Entity> gridPro = new GridPro<>();
        gridPro.setId("gridpro");

        MenuBar menuBar = new MenuBar();
        menuBar.addItem("foo");
        menuBar.setId("menubar");

        RichTextEditor richTextEditor = new RichTextEditor();
        richTextEditor.setId("richtexteditor");

        final TextField wrappedField = new TextField();
        CustomField<String> customField = new CustomField<String>() {
            {
                setLabel("Name");
                add(wrappedField);
            }

            @Override
            protected String generateModelValue() {
                return wrappedField.getValue();
            }

            @Override
            protected void setPresentationValue(String newPresentationValue) {
                wrappedField.setValue(newPresentationValue);
            }
        };
        customField.setId("customfield");

        VerticalLayout components = new VerticalLayout();
        VerticalLayout layouts = new VerticalLayout();

        LoginForm loginForm = new LoginForm();
        loginForm.setId("loginform");

        Details details = new Details("Summary", new Span("Content"));
        details.setId("details");

        Accordion accordion = new Accordion();
        accordion.add("Title", new Paragraph("Content"));
        accordion.setId("accordion");

        add(new HorizontalLayout(components, layouts));

        components.add(button);
        components.add(checkbox);
        components.add(checkboxGroup);
        components.add(combobox);
        components.add(dialogButton);
        components.add(confirmDialogButton);
        components.add(datePicker);
        components.add(dateTimePicker);
        components.add(timePicker);
        components.add(select);
        components.add(details);
        components.add(grid);
        components.add(icons);
        components.add(ironList);
        components.add(listBox);
        components.add(progressBar);
        components.add(radioButtons);
        components.add(textField);
        components.add(passwordField);
        components.add(textArea);
        components.add(upload);
        components.add(cookieConsent);
        components.add(crud);
        components.add(loginForm);
        components.add(gridPro);
        components.add(richTextEditor);
        components.add(customField);
        components.add(menuBar);

        layouts.add(formLayout);
        layouts.add(verticalLayout);
        layouts.add(horizontalLayout);
        layouts.add(splitHorizontal);
        layouts.add(splitVertical);
        layouts.add(tabs);
        layouts.add(contextMenuTarget);
        layouts.add(board);
        layouts.add(appLayout);
        layouts.add(accordion);

    }

    private Map<String, String> map(String value1, String value2) {
        Map<String, String> map = new HashMap<>();
        map.put("foo", value1);
        map.put("bar", value2);
        return map;
    }

    private void handleUploadedFile(String mimeType, String fileName,
            InputStream stream) {
        if (mimeType.startsWith("text")) {
            String text = "";
            try {
                text = IOUtils.toString(stream, "UTF-8");
            } catch (IOException e) {
                text = "exception reading stream";
            }
            log.log("Upload received file " + fileName + " with text " + text);
        } else {
            String text = String.format("Mime type: '%s'\nSHA-256 hash: '%s'",
                    mimeType, MessageDigestUtil.sha256(stream.toString()));
            log.log("Upload received file " + fileName + " with " + text);
        }
    }

}
