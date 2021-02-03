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
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import org.apache.commons.io.IOUtils;

import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.HtmlComponent;
import com.vaadin.flow.component.accordion.Accordion;
import com.vaadin.flow.component.accordion.AccordionPanel;
import com.vaadin.flow.component.applayout.AppLayout;
import com.vaadin.flow.component.applayout.DrawerToggle;
import com.vaadin.flow.component.avatar.Avatar;
import com.vaadin.flow.component.avatar.AvatarGroup;
import com.vaadin.flow.component.avatar.AvatarGroup.AvatarGroupItem;
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
import com.vaadin.flow.component.contextmenu.MenuItem;
import com.vaadin.flow.component.cookieconsent.CookieConsent;
import com.vaadin.flow.component.crud.BinderCrudEditor;
import com.vaadin.flow.component.crud.Crud;
import com.vaadin.flow.component.crud.CrudFilter;
import com.vaadin.flow.component.crud.CrudGrid;
import com.vaadin.flow.component.customfield.CustomField;
import com.vaadin.flow.component.datepicker.DatePicker;
import com.vaadin.flow.component.datetimepicker.DateTimePicker;
import com.vaadin.flow.component.details.Details;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.formlayout.FormLayout;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.grid.GridSelectionColumn;
import com.vaadin.flow.component.grid.contextmenu.GridContextMenu;
import com.vaadin.flow.component.grid.contextmenu.GridMenuItem;
import com.vaadin.flow.component.gridpro.GridPro;
import com.vaadin.flow.component.html.Anchor;
import com.vaadin.flow.component.html.Article;
import com.vaadin.flow.component.html.Aside;
import com.vaadin.flow.component.html.DescriptionList;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Emphasis;
import com.vaadin.flow.component.html.Footer;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.H4;
import com.vaadin.flow.component.html.H5;
import com.vaadin.flow.component.html.H6;
import com.vaadin.flow.component.html.Header;
import com.vaadin.flow.component.html.Hr;
import com.vaadin.flow.component.html.IFrame;
import com.vaadin.flow.component.html.Image;
import com.vaadin.flow.component.html.Input;
import com.vaadin.flow.component.html.Label;
import com.vaadin.flow.component.html.ListItem;
import com.vaadin.flow.component.html.Main;
import com.vaadin.flow.component.html.NativeButton;
import com.vaadin.flow.component.html.Nav;
import com.vaadin.flow.component.html.OrderedList;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.html.Pre;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.html.UnorderedList;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.IronIcon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.internal.JavaScriptBootstrapUI;
import com.vaadin.flow.component.ironlist.IronList;
import com.vaadin.flow.component.listbox.ListBox;
import com.vaadin.flow.component.listbox.MultiSelectListBox;
import com.vaadin.flow.component.login.LoginForm;
import com.vaadin.flow.component.login.LoginOverlay;
import com.vaadin.flow.component.menubar.MenuBar;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.Notification.Position;
import com.vaadin.flow.component.orderedlayout.FlexLayout;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.Scroller;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.progressbar.ProgressBar;
import com.vaadin.flow.component.radiobutton.RadioButtonGroup;
import com.vaadin.flow.component.richtexteditor.RichTextEditor;
import com.vaadin.flow.component.select.Select;
import com.vaadin.flow.component.splitlayout.SplitLayout;
import com.vaadin.flow.component.splitlayout.SplitLayout.Orientation;
import com.vaadin.flow.component.tabs.Tab;
import com.vaadin.flow.component.tabs.Tabs;
import com.vaadin.flow.component.textfield.BigDecimalField;
import com.vaadin.flow.component.textfield.EmailField;
import com.vaadin.flow.component.textfield.IntegerField;
import com.vaadin.flow.component.textfield.NumberField;
import com.vaadin.flow.component.textfield.PasswordField;
import com.vaadin.flow.component.textfield.TextArea;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.component.timepicker.TimePicker;
import com.vaadin.flow.component.treegrid.TreeGrid;
import com.vaadin.flow.component.upload.Upload;
import com.vaadin.flow.component.upload.receivers.MemoryBuffer;
import com.vaadin.flow.component.webcomponent.WebComponentUI;
import com.vaadin.flow.component.webcomponent.WebComponentWrapper;
import com.vaadin.flow.data.binder.Binder;
import com.vaadin.flow.data.provider.AbstractBackEndDataProvider;
import com.vaadin.flow.data.provider.Query;
import com.vaadin.flow.data.provider.hierarchy.AbstractBackEndHierarchicalDataProvider;
import com.vaadin.flow.data.provider.hierarchy.HierarchicalDataProvider;
import com.vaadin.flow.data.provider.hierarchy.HierarchicalQuery;
import com.vaadin.flow.data.value.ValueChangeMode;
import com.vaadin.flow.internal.MessageDigestUtil;
import com.vaadin.flow.router.Route;

@Route("")
public class ComponentsView extends AppLayout {

    private static final long serialVersionUID = 1L;

    private Log log;
    private List<Entity> entities;

    @SuppressWarnings("unused")
    public ComponentsView() {
        log = new Log();

        entities = Arrays.asList(new Entity("Pato", new Entity("Donald")),
                new Entity("Toro", new Entity("Bravo"), new Entity("Manso")), new Entity("Perro"), new Entity("Gato"));

        // setup application layout
        AppLayout appLayout = this;
        DrawerToggle drawerToggle = new DrawerToggle();
        appLayout.addToNavbar(drawerToggle);
        VerticalLayout components = new VerticalLayout();
        VerticalLayout layouts = new VerticalLayout();
        Hr hr = new Hr();
        appLayout.setContent(new VerticalLayout(log, components, hr, layouts, new HorizontalLayout()));

        // Components
        H1 h1 = new H1("h1");

        H2 h2 = new H2("h2");

        H3 h3 = new H3("h3");

        H4 h4 = new H4("h4");

        H5 h5 = new H5("h5");

        H6 h6 = new H6("h6");

        Div div = new Div(h1, h2, h3, h4, h5, h6);

        Span span = new Span("Header");

        Header header = new Header(span);

        Anchor anchor = new Anchor("#", "anchor");

        ListItem listItem = new ListItem("ordered list");
        OrderedList orderedList = new OrderedList(listItem);

        UnorderedList unorderedList = new UnorderedList(new ListItem("unordered list"));

        Aside aside = new Aside(new Span("Aside"));
        Article article = new Article(anchor);
        Nav nav = new Nav(new Span("nav"));

        DescriptionList descriptionList = new DescriptionList();

        Emphasis emphasis = new Emphasis("enphasis");
        Footer footer = new Footer(new Span("Footer"));
        IFrame iFrame = new IFrame("");
        Image image = new Image("data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", "image");
        image.setWidth("20px");
        image.getElement().getStyle().set("background", "blue");
        Input input = new Input();
        Label label = new Label("label");
        NativeButton nativeButton = new NativeButton("nativeButton");
        Pre pre = new Pre("pre");
        Component sel = new HtmlComponent("select");

        // Using full qualified name since in parent class there is a Section Enum
        com.vaadin.flow.component.html.Section section =
                new com.vaadin.flow.component.html.Section(new Span("section"));

        Scroller scroller = new Scroller(section);

        Main main = new Main(div, header, anchor, orderedList, unorderedList, descriptionList, aside, article, nav,
                emphasis, footer, iFrame, image, input, label, nativeButton, pre, scroller, sel);

        IronIcon ironIcon = new IronIcon("communication", "email");

        Icon icon = new Icon(VaadinIcon.AIRPLANE);

        Button button = new Button("Button text", e -> {
            log.log("Clicked button");
        });
        button.setIcon(icon);

        Checkbox checkbox = new Checkbox("Checkbox label");
        log.log("Checkbox default is " + checkbox.getValue());
        checkbox.addValueChangeListener(e -> {
            log.log("Checkbox value changed from '" + e.getOldValue() + "' to '" + e.getValue() + "'");
        });

        CheckboxGroup<String> checkboxGroup = new CheckboxGroup<>();
        checkboxGroup.setItems("foo", "bar");
        checkboxGroup.addValueChangeListener(event -> log
                .log("CheckboxGroup value changed from '" + event.getOldValue() + "' to '" + event.getValue() + "'"));

        ComboBox<String> comboBox = new ComboBox<>("ComboBox label");
        comboBox.setItems("First", "Second", "Third");
        comboBox.addValueChangeListener(e -> {
            log.log("ComboBox value changed from '" + e.getOldValue() + "' to '" + e.getValue() + "'");
        });

        DatePicker datePicker = new DatePicker();
        log.log("DatePicker default is " + datePicker.getValue());
        datePicker.addValueChangeListener(e -> {
            log.log("DatePicker value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        DateTimePicker dateTimePicker = new DateTimePicker();
        log.log("DateTimePicker default is " + dateTimePicker.getValue());
        dateTimePicker.addValueChangeListener(e -> {
            log.log("DateTimePicker value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        TimePicker timePicker = new TimePicker();
        log.log("TimePicker default is " + timePicker.getValue());
        timePicker.addValueChangeListener(e -> {
            log.log("TimePicker value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        Select<String> select = new Select<>();
        select.setItems("Spring", "Summer", "Autumn", "Winter");
        log.log("Select default is " + select.getValue());
        select.addValueChangeListener(e -> {
            log.log("Select value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        GridSelectionColumn gridSelectionColumn = new GridSelectionColumn(() -> log.log("select-all"), () -> {});
        Grid<Map<String, String>> grid = new Grid<>();
        grid.setWidth("100%");
        grid.getElement().insertChild(0, gridSelectionColumn.getElement());
        grid.addColumn(map -> map.get("foo")).setHeader("Foo-Header");
        grid.addColumn(map -> map.get("bar")).setHeader("Bar-Header");
        grid.addSelectionListener(e -> log.log("Grid selection changed to '" + e.getFirstSelectedItem() + "'"));

        List<Map<String, String>> gridItems = new ArrayList<>();
        gridItems.add(map("Some", "Data"));
        gridItems.add(map("Second", "Row"));
        grid.setItems(gridItems);

        GridContextMenu<Map<String, String>> gridContextMenu = grid.addContextMenu();
        gridContextMenu.addItem("foo",
                e -> e.getItem().ifPresent(item -> log.log("GridContextMenu on item " + item.get("foo"))));
        gridContextMenu.setOpenOnClick(true);
        gridContextMenu.setId("gridcontextmenu");

        GridMenuItem<Map<String, String>> gridMenuItem = new GridMenuItem<>(gridContextMenu, () -> {});


        HierarchicalDataProvider<Entity, Void> hierarchicalDataProvider = new AbstractBackEndHierarchicalDataProvider<Entity, Void>() {
            private static final long serialVersionUID = 1L;

            @Override
            public int getChildCount(HierarchicalQuery<Entity, Void> query) {
                return query.getParent() == null ? entities.size() : query.getParent().getEntities().size();
            }
            @Override
            public boolean hasChildren(Entity item) {
                return !item.getEntities().isEmpty();
            }
            @Override
            protected Stream<Entity> fetchChildrenFromBackEnd(HierarchicalQuery<Entity, Void> query) {
                return query.getParent() == null ? entities.stream() : query.getParent().getEntities().stream();
            }
        };
        TreeGrid<Entity> treeGrid = new TreeGrid<>();
        treeGrid.addHierarchyColumn(Entity::getName).setHeader("Name");
        treeGrid.addColumn(e -> e.getEntities().size()).setHeader("child count");
        treeGrid.setDataProvider(hierarchicalDataProvider);


        HorizontalLayout icons = new HorizontalLayout(new Icon(VaadinIcon.VAADIN_H), new Icon(VaadinIcon.VAADIN_V));

        IronList<String> ironList = new IronList<>();
        ironList.setHeight("50px");
        Stream<String> items = IntStream.range(0, 100).mapToObj(i -> ("Item " + i));
        ironList.setItems(items);

        ListBox<String> listBox = new ListBox<>();
        listBox.setItems(IntStream.range(0, 7).mapToObj(i -> ("Item " + i)).collect(Collectors.toList()));
        Div listBoxComponent = new Div();
        listBoxComponent.setId("list-box-component");
        listBoxComponent.setText("One more item as a component");
        listBox.addValueChangeListener(event -> log
                .log("ListBox value changed from '" + event.getOldValue() + "' to '" + event.getValue() + "'"));
        listBox.add(listBoxComponent);

        MultiSelectListBox<String> multiSelectListBox = new MultiSelectListBox<>();
        multiSelectListBox.setItems(IntStream.range(0, 7).mapToObj(i -> ("Item " + i)).collect(Collectors.toList()));
        multiSelectListBox.addValueChangeListener(event -> log
                .log("MultiSelectListBox value changed from '" + event.getOldValue() + "' to '" + event.getValue() + "'"));

        ProgressBar progressBar = new ProgressBar();
        progressBar.setWidth("100%");
        progressBar.setValue(0.7);

        RadioButtonGroup<String> radioButtonGroup = new RadioButtonGroup<>();
        log.log("RadioButtonGroup default is " + radioButtonGroup.getValue());
        radioButtonGroup.setItems(IntStream.range(0, 5).mapToObj(i -> ("Item " + i)).collect(Collectors.toList()));
        radioButtonGroup.addValueChangeListener(e -> {
            log.log("RadioButtonGroup value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        TextField textField = new TextField();
        textField.setValueChangeMode(ValueChangeMode.EAGER);
        log.log("TextField default is " + textField.getValue());
        textField.addValueChangeListener(e -> {
            log.log("TextField value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        PasswordField passwordField = new PasswordField();
        passwordField.setValueChangeMode(ValueChangeMode.EAGER);
        log.log("PasswordField default is " + passwordField.getValue());
        passwordField.addValueChangeListener(e -> {
            log.log("PasswordField value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        BigDecimalField bigDecimalField = new BigDecimalField();
        bigDecimalField.setValueChangeMode(ValueChangeMode.EAGER);
        log.log("bigDecimalField default is " + bigDecimalField.getValue());
        bigDecimalField.addValueChangeListener(e -> {
            log.log("bigDecimalField value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        NumberField numberField = new NumberField();
        numberField.setValueChangeMode(ValueChangeMode.EAGER);
        log.log("numberField default is " + numberField.getValue());
        numberField.addValueChangeListener(e -> {
            log.log("numberField value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        EmailField emailField = new EmailField();
        emailField.setValueChangeMode(ValueChangeMode.EAGER);
        log.log("emailField default is " + emailField.getValue());
        emailField.addValueChangeListener(e -> {
            log.log("emailField value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        IntegerField integerField = new IntegerField();
        integerField.setValueChangeMode(ValueChangeMode.EAGER);
        log.log("integerField default is " + integerField.getValue());
        integerField.addValueChangeListener(e -> {
            log.log("integerField value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        TextArea textArea = new TextArea();
        textArea.setValueChangeMode(ValueChangeMode.EAGER);
        log.log("TextArea default is " + textArea.getValue());
        textArea.addValueChangeListener(e -> {
            log.log("TextArea value changed from " + e.getOldValue() + " to " + e.getValue());
        });

        MemoryBuffer buffer = new MemoryBuffer();
        Upload upload = new Upload(buffer);
        upload.addSucceededListener(
                event -> handleUploadedFile(event.getMIMEType(), event.getMIMEType(), buffer.getInputStream()));

        Dialog dialog = new Dialog();
        dialog.add(new Label("This is the contents of the dialog"));
        Button dialogButton = new Button("open Dialog", event -> dialog.open());
        dialogButton.setId("open-dialog");

        Notification notification = new Notification("Hello", 2000000, Position.TOP_CENTER);
        notification.open();

        // Layouts
        FormLayout formLayout = new FormLayout();
        IntStream.range(0, 6).forEach(i -> {
            formLayout.add(new TextField("FormLayout field " + i));
        });

        VerticalLayout verticalLayout = new VerticalLayout();
        verticalLayout.setId("verticallayout");
        IntStream.range(0, 3).forEach(i -> verticalLayout.add(new Button("VerticalLayout Button " + i)));

        HorizontalLayout horizontalLayout = new HorizontalLayout();
        horizontalLayout.setId("horizontallayout");
        IntStream.range(0, 3).forEach(i -> horizontalLayout.add(new Button("HorizontalLayout Button " + i)));

        FlexLayout flexLayout = new FlexLayout();
        flexLayout.setId("flexLayout");
        IntStream.range(0, 3).forEach(i -> flexLayout.add(new Button("FlexLayout Button " + i)));

        SplitLayout splitLayout = new SplitLayout(new Button("Button Left"), new Button("Button Right"));
        splitLayout.getStyle().set("flex", "none");
        splitLayout.setId("splithorizontal");

        SplitLayout splitVertical = new SplitLayout(new Button("Button Top"), new Button("Button Bottom"));
        splitVertical.setOrientation(Orientation.VERTICAL);
        splitVertical.getStyle().set("flex", "none");

        Tabs tabs = new Tabs();
        Tab tab = new Tab("foo");
        tabs.add(tab, new Tab("bar"));
        tabs.addSelectedChangeListener(event -> log.log("Tabs selected index changed to " + tabs.getSelectedIndex()));

        Div contextMenuTarget = new Div();
        contextMenuTarget.setText("Context Menu Target");
        contextMenuTarget.setId("context-menu-target");
        ContextMenu contextMenu = new ContextMenu(contextMenuTarget);
        contextMenu.setId("the-context-menu");
        contextMenu.setOpenOnClick(true);
        contextMenu.addItem(new Span("Item 0"), event -> log.log("Context menu Item 0 is clicked"));
        contextMenu.addItem(new Span("Item 1"), event -> log.log("Context menu Item 1 is clicked"));
        MenuItem menuItem = new MenuItem(contextMenu, null);

        Board board = new Board();
        board.setId("board");
        Label aheader = new Label("This is a board");
        aheader.getElement().getStyle().set("background-color", "lightblue");
        aheader.getElement().getStyle().set("text-align", "center");
        aheader.setWidth("100%");
        Row row = new Row(aheader);
        row.setComponentSpan(aheader, 4);

        Chart chart = new Chart(ChartType.LINE);
        chart.setId("chart");
        chart.getElement().getStyle().set("height", "100px");
        chart.getConfiguration().addSeries(new ListSeries(1, 3, 2, 4, 3, 5, 5, 4, 7));
        chart.getElement().getStyle().set("width", "100%");
        chart.getElement().getStyle().set("height", "100%");
        Chart barChart = new Chart(ChartType.BAR);
        barChart.getConfiguration().addSeries(new ListSeries(1, 3, 2, 4, 3, 5, 5, 4, 7));
        barChart.getElement().getStyle().set("height", "100%");
        barChart.getElement().getStyle().set("width", "100%");

        Row row2 = new Row(chart, barChart);
        row2.setComponentSpan(chart, 2);
        row2.setComponentSpan(barChart, 2);

        board.add(row, row2);

        ConfirmDialog confirmDialog = new ConfirmDialog();
        confirmDialog.setHeader("Meeting starting");
        confirmDialog.setText("Your next meeting starts in 5 minutes");
        confirmDialog.setConfirmText("OK");
        Button confirmDialogButton = new Button("open confirm Dialog", event -> confirmDialog.open());
        confirmDialogButton.setId("open-confirm-dialog");

        CookieConsent cookieConsent = new CookieConsent();

        AbstractBackEndDataProvider<Entity, CrudFilter> crudProvider = new AbstractBackEndDataProvider<Entity, CrudFilter>() {
            private static final long serialVersionUID = 1L;

            @Override
            protected Stream<Entity> fetchFromBackEnd(Query<Entity, CrudFilter> query) {
                return entities.stream();
            }

            @Override
            protected int sizeInBackEnd(Query<Entity, CrudFilter> query) {
                return entities.size();
            }
        };

        Binder<Entity> crudBinder = new Binder<>(Entity.class);
        TextField nameField = new TextField("name");
        crudBinder.bind(nameField, Entity::getName, Entity::setName);
        BinderCrudEditor<Entity> binderCrudEditor = new BinderCrudEditor<>(crudBinder, nameField);
        CrudGrid<Entity> crudGrid = new CrudGrid<>(Entity.class, true);
        Crud<Entity> crud = new Crud<>(Entity.class, crudGrid, binderCrudEditor);
        crud.setDataProvider(crudProvider);

        GridPro<Entity> gridPro = new GridPro<>();
        gridPro.setId("gridpro");

        MenuBar menuBar = new MenuBar();
        menuBar.addItem("foo");
        menuBar.setId("menubar");

        RichTextEditor richTextEditor = new RichTextEditor();
        richTextEditor.setId("richtexteditor");

        final TextField wrappedField = new TextField();
        CustomField<String> customField = new CustomField<String>() {
            private static final long serialVersionUID = 1L;
            {
                add(wrappedField);
                setLabel("Name");
                setId("customfield");
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

        LoginForm loginForm = new LoginForm();

        LoginOverlay loginOverlay = new LoginOverlay();
        loginOverlay.addLoginListener(e -> loginOverlay.close());
        loginOverlay.addForgotPasswordListener(e -> loginOverlay.close());
        Button openLoginOverlay = new Button("open Login Overlay", e -> loginOverlay.setOpened(true));
        openLoginOverlay.setId("open-login-overlay");

        Details details = new Details("Details", new Span("Content"));

        Accordion accordion = new Accordion();
        Paragraph paragraph = new Paragraph("content");
        accordion.add("Accordion", paragraph);

        AccordionPanel accordionPanel = new AccordionPanel("AccordionPanel", new Span("Content"));

        Avatar avatar = new Avatar("Donald");
        AvatarGroup avatarGroup = new AvatarGroup(new AvatarGroupItem("Pluto"), new AvatarGroupItem("Mickey"));


        // These components are flow internal classes, these lines is to make pass the ComponentUsageTest
        JavaScriptBootstrapUI javaScriptBootstrapUI;
        WebComponentUI webComponentUI;
        WebComponentWrapper webComponentWrapper;

        components.add(ironIcon);
        components.add(button);
        components.add(checkbox);
        components.add(checkboxGroup);
        components.add(comboBox);
        components.add(dialogButton);
        components.add(confirmDialogButton);
        components.add(datePicker);
        components.add(dateTimePicker);
        components.add(timePicker);
        components.add(select);
        components.add(grid);
        components.add(treeGrid);
        components.add(icons);
        components.add(ironList);
        components.add(listBox);
        components.add(multiSelectListBox);
        components.add(progressBar);
        components.add(radioButtonGroup);
        components.add(textField);
        components.add(passwordField);
        components.add(emailField);
        components.add(bigDecimalField);
        components.add(numberField);
        components.add(integerField);
        components.add(textArea);
        components.add(upload);
        components.add(cookieConsent);
        components.add(crud);
        components.add(openLoginOverlay);
        components.add(loginForm);
        components.add(gridPro);
        components.add(richTextEditor);
        components.add(customField);
        components.add(menuBar);
        components.add(avatar);
        components.add(avatarGroup);
        components.add(main);

        layouts.add(formLayout);
        layouts.add(verticalLayout);
        layouts.add(horizontalLayout);
        layouts.add(flexLayout);
        layouts.add(splitLayout);
        layouts.add(splitVertical);
        layouts.add(tabs);
        layouts.add(contextMenuTarget);
        layouts.add(board);
        layouts.add(details);
        layouts.add(accordion);
        layouts.add(accordionPanel);
    }

    private Map<String, String> map(String value1, String value2) {
        Map<String, String> map = new HashMap<>();
        map.put("foo", value1);
        map.put("bar", value2);
        return map;
    }

    private void handleUploadedFile(String mimeType, String fileName, InputStream stream) {
        if (mimeType.startsWith("text")) {
            String text = "";
            try {
                text = IOUtils.toString(stream, "UTF-8");
            } catch (IOException e) {
                text = "exception reading stream";
            }
            log.log("Upload received file " + fileName + " with text " + text);
        } else {
            String text = String.format("Mime type: '%s'\nSHA-256 hash: '%s'", mimeType,
                    MessageDigestUtil.sha256(stream.toString()));
            log.log("Upload received file " + fileName + " with " + text);
        }
    }

}
