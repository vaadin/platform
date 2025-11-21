/*
 * Copyright 2000-2023 Vaadin Ltd.
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

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import com.vaadin.collaborationengine.CollaborationAvatarGroup;
import com.vaadin.collaborationengine.CollaborationEngine;
import com.vaadin.collaborationengine.CollaborationEngineConfiguration;
import com.vaadin.collaborationengine.UserInfo;
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
import com.vaadin.flow.component.card.Card;
import com.vaadin.flow.component.charts.Chart;
import com.vaadin.flow.component.charts.model.ChartType;
import com.vaadin.flow.component.charts.model.ListSeries;
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.checkbox.CheckboxGroup;
import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.combobox.MultiSelectComboBox;
import com.vaadin.flow.component.confirmdialog.ConfirmDialog;
import com.vaadin.flow.component.contextmenu.ContextMenu;
import com.vaadin.flow.component.contextmenu.MenuItem;
import com.vaadin.flow.component.crud.BinderCrudEditor;
import com.vaadin.flow.component.crud.Crud;
import com.vaadin.flow.component.crud.CrudFilter;
import com.vaadin.flow.component.crud.CrudGrid;
import com.vaadin.flow.component.customfield.CustomField;
import com.vaadin.flow.component.dashboard.Dashboard;
import com.vaadin.flow.component.dashboard.DashboardSection;
import com.vaadin.flow.component.dashboard.DashboardWidget;
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
import com.vaadin.flow.component.html.Abbr;
import com.vaadin.flow.component.html.Anchor;
import com.vaadin.flow.component.html.Article;
import com.vaadin.flow.component.html.Aside;
import com.vaadin.flow.component.html.Code;
import com.vaadin.flow.component.html.DescriptionList;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Emphasis;
import com.vaadin.flow.component.html.FieldSet;
import com.vaadin.flow.component.html.Footer;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.H4;
import com.vaadin.flow.component.html.H5;
import com.vaadin.flow.component.html.H6;
import com.vaadin.flow.component.html.Header;
import com.vaadin.flow.component.html.Hr;
import com.vaadin.flow.component.html.HtmlObject;
import com.vaadin.flow.component.html.IFrame;
import com.vaadin.flow.component.html.Image;
import com.vaadin.flow.component.html.Input;
import com.vaadin.flow.component.html.ListItem;
import com.vaadin.flow.component.html.Main;
import com.vaadin.flow.component.html.NativeButton;
import com.vaadin.flow.component.html.NativeDetails;
import com.vaadin.flow.component.html.NativeLabel;
import com.vaadin.flow.component.html.NativeTable;
import com.vaadin.flow.component.html.NativeTableBody;
import com.vaadin.flow.component.html.NativeTableCaption;
import com.vaadin.flow.component.html.NativeTableCell;
import com.vaadin.flow.component.html.NativeTableFooter;
import com.vaadin.flow.component.html.NativeTableHeader;
import com.vaadin.flow.component.html.NativeTableHeaderCell;
import com.vaadin.flow.component.html.NativeTableRow;
import com.vaadin.flow.component.html.Nav;
import com.vaadin.flow.component.html.OrderedList;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.html.Param;
import com.vaadin.flow.component.html.Pre;
import com.vaadin.flow.component.html.RangeInput;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.html.UnorderedList;
import com.vaadin.flow.component.icon.FontIcon;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.SvgIcon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.listbox.ListBox;
import com.vaadin.flow.component.listbox.MultiSelectListBox;
import com.vaadin.flow.component.login.LoginForm;
import com.vaadin.flow.component.login.LoginOverlay;
import com.vaadin.flow.component.markdown.Markdown;
import com.vaadin.flow.component.masterdetaillayout.MasterDetailLayout;
import com.vaadin.flow.component.menubar.MenuBar;
import com.vaadin.flow.component.messages.MessageInput;
import com.vaadin.flow.component.messages.MessageList;
import com.vaadin.flow.component.messages.MessageListItem;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.Notification.Position;
import com.vaadin.flow.component.orderedlayout.FlexLayout;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.Scroller;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.popover.Popover;
import com.vaadin.flow.component.progressbar.ProgressBar;
import com.vaadin.flow.component.radiobutton.RadioButtonGroup;
import com.vaadin.flow.component.react.ReactRouterOutlet;
import com.vaadin.flow.component.richtexteditor.RichTextEditor;
import com.vaadin.flow.component.select.Select;
import com.vaadin.flow.component.sidenav.SideNav;
import com.vaadin.flow.component.sidenav.SideNavItem;
import com.vaadin.flow.component.splitlayout.SplitLayout;
import com.vaadin.flow.component.splitlayout.SplitLayout.Orientation;
import com.vaadin.flow.component.tabs.Tab;
import com.vaadin.flow.component.tabs.TabSheet;
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
import com.vaadin.flow.component.virtuallist.VirtualList;
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
import com.vaadin.flow.internal.StringUtil;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.VaadinService;
import com.vaadin.flow.server.streams.UploadHandler;

@Route("")
public class ComponentsView extends AppLayout {

    static {
        CollaborationEngineConfiguration cfg = new CollaborationEngineConfiguration();
        // Deactivate Push (https://github.com/vaadin/collaboration-engine-internal/issues/615)
        cfg.setAutomaticallyActivatePush(false);
        CollaborationEngine.configure(VaadinService.getCurrent(), cfg);
    }

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

        Abbr abbr = new Abbr("abbr");
        Anchor anchor = new Anchor("#", "anchor");

        ListItem listItem = new ListItem("ordered list");
        OrderedList orderedList = new OrderedList(listItem);

        UnorderedList unorderedList = new UnorderedList(new ListItem("unordered list"));

        Aside aside = new Aside(new Span("Aside"));
        Code code = new Code("Code");
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
        NativeLabel label = new NativeLabel("label");
        NativeButton nativeButton = new NativeButton("nativeButton");
        Pre pre = new Pre("pre");
        Component sel = new HtmlComponent("select");
        NativeDetails nativeDetails = new NativeDetails(new Span("native details"));
        nativeDetails.setContent(new Span("content"));
        HtmlObject htmlObject = new HtmlObject();
        Param param = new Param();
        RangeInput rangeInput = new RangeInput();

        NativeTable nativeTable = new NativeTable();
        NativeTableBody nativeTableBody = new NativeTableBody();
        NativeTableCaption nativeTableCaption = new NativeTableCaption();
        NativeTableCell nativeTableCell = new NativeTableCell();
        NativeTableFooter nativeTableFooter = new NativeTableFooter();
        NativeTableHeader nativeTableHeader = new NativeTableHeader();
        NativeTableHeaderCell nativeTableHeaderCell = new NativeTableHeaderCell();
        NativeTableRow nativeTableRow = new NativeTableRow();

        // Using full qualified name since in parent class there is a Section Enum
        com.vaadin.flow.component.html.Section section =
                new com.vaadin.flow.component.html.Section(new Span("section"));

        Scroller scroller = new Scroller(section);

        Main main = new Main(div, header, abbr, anchor, orderedList, unorderedList, descriptionList, aside, code, article, nav,
                emphasis, footer, iFrame, image, input, label, nativeButton, pre, scroller, sel, nativeDetails, htmlObject, param, rangeInput,
                nativeTable, nativeTableBody, nativeTableCell, nativeTableCaption, nativeTableFooter, nativeTableHeader, nativeTableHeaderCell, nativeTableRow);

        Icon icon = new Icon(VaadinIcon.AIRPLANE);
        FontIcon fontIcon = new FontIcon("fa-solid", "fa-user");
        SvgIcon svgIcon = new SvgIcon();;
        components.add(fontIcon);
        components.add(svgIcon);

        Button button = new Button("Button text", e -> {
            log.log("Clicked button");
        });
        button.setIcon(icon);

        Card card = new Card();
        card.setTitle(new Div("Lapland"));
        card.add(new Div("Lapland is the northern-most region of Finland and an active outdoor destination."));

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

        MultiSelectComboBox multiSelectComboBox = new MultiSelectComboBox<>();
        multiSelectComboBox.setItems(Arrays.asList("foo", "bar", "baz"));
        multiSelectComboBox.setValue(Set.of("foo", "bar"));
        multiSelectComboBox.addValueChangeListener(e -> {
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
        timePicker.setId("time-picker");
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

        VirtualList<String> virtualList = new VirtualList<>();
        virtualList.setHeight("50px");
        Stream<String> virtualListItems = IntStream.range(0, 100).mapToObj(i -> ("Item " + i));
        virtualList.setItems(virtualListItems);

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

        Upload upload = new Upload(UploadHandler.inMemory(
                (metadata, data) -> handleUploadedFile(
                        metadata.contentType(), metadata.fileName(), new ByteArrayInputStream(data)
                )
        ));

        Dialog dialog = new Dialog();
        dialog.add(new NativeLabel("This is the contents of the dialog"));
        Button dialogButton = new Button("open Dialog", event -> dialog.open());
        dialogButton.setId("open-dialog");

        Notification notification = new Notification("Hello", 2000000, Position.TOP_CENTER);
        notification.open();

        // Layouts
        FormLayout formLayout = new FormLayout();
        IntStream.range(0, 6).forEach(i -> {
            formLayout.add(new TextField("FormLayout field " + i));
        });
        formLayout.addFormItem(new TextField(), "formLayout form-item");

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

        TabSheet tabSheet = new TabSheet();
        tabSheet.add("Tab one", new Span("Tab one content"));
        tabSheet.add("Tab two", new Span("Tab two content"));
        tabSheet.addSelectedChangeListener(event -> log.log("TabSheet selected index changed to " + tabSheet.getSelectedIndex()));

        MasterDetailLayout masterDetailLayout = new MasterDetailLayout();
        masterDetailLayout.setMaster(new Div("Master content"));
        masterDetailLayout.setDetail(new Div("Detail content"));

        Markdown markdown = new Markdown("**Hello** _World_");

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
        NativeLabel aheader = new NativeLabel("This is a board");
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

        // Test for avatar components
        Avatar avatar = new Avatar("Donald");
        AvatarGroup avatarGroup = new AvatarGroup(new AvatarGroupItem("Pluto"), new AvatarGroupItem("Mickey"));

        // Tests for collaboration engine
        CollaborationAvatarGroup collaborationAvatarGroup =
                new CollaborationAvatarGroup(new UserInfo("foo", "foo"), "topic-id");
        collaborationAvatarGroup.setId("collab-avatar-group-1");
        CollaborationAvatarGroup collaborationAvatarGroup2 =
                new CollaborationAvatarGroup(new UserInfo("bar", "bar"), "topic-id");
        collaborationAvatarGroup2.setId("collab-avatar-group-2");

        MessageList messageList = new MessageList();
        messageList.setItems(new MessageListItem("foo"), new MessageListItem("bar"));

        MessageInput messageInput = new MessageInput();
        messageInput.addSubmitListener(e -> log.log(e.getValue()));

        com.vaadin.flow.component.map.Map mapComponent = new com.vaadin.flow.component.map.Map();

        Popover popover = new Popover();

        SideNav sideNav = new SideNav("Navigation");
        sideNav.setCollapsible(true);
        sideNav.addItem(new SideNavItem("Nav item 1", "/1"));
        SideNavItem sideNavItem = new SideNavItem("Nav item 2", "/2");
        sideNavItem.addItem(new SideNavItem("Nav item 2 - 1", "/2/1"));
        sideNavItem.addItem(new SideNavItem("Nav item 2 - 2", "/2/2"));
        sideNav.addItem(sideNavItem);

        NativeLabel nativeLabel = new NativeLabel("Native Label");
        ReactRouterOutlet reactRouterOutlet = new ReactRouterOutlet();
        FieldSet fieldSet = new FieldSet();

        Dashboard dashboard = new Dashboard();
        DashboardWidget dashboardWidget = new DashboardWidget();
        dashboardWidget.setTitle("Widget");
        dashboardWidget.setContent(new Span("Content"));
        dashboard.add(dashboardWidget);
        DashboardSection dashboardSection = dashboard.addSection("Section");
        DashboardWidget widgetInSection = new DashboardWidget();
        widgetInSection.setTitle("Widget in Section");
        widgetInSection.setContent(new Span("Content"));
        dashboardSection.add(widgetInSection);

        // These components are flow internal classes, these lines is to make pass the ComponentUsageTest
        WebComponentUI webComponentUI;
        WebComponentWrapper webComponentWrapper;

        components.add(button);
        components.add(card);
        components.add(checkbox);
        components.add(checkboxGroup);
        components.add(comboBox);
        components.add(multiSelectComboBox);
        components.add(dialogButton);
        components.add(confirmDialogButton);
        components.add(datePicker);
        components.add(dateTimePicker);
        components.add(timePicker);
        components.add(select);
        components.add(grid);
        components.add(treeGrid);
        components.add(icons);
        components.add(virtualList);
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
        components.add(crud);
        components.add(openLoginOverlay);
        components.add(loginForm);
        components.add(gridPro);
        components.add(richTextEditor);
        components.add(customField);
        components.add(menuBar);
        components.add(avatar);
        components.add(avatarGroup);
        components.add(collaborationAvatarGroup, collaborationAvatarGroup2);
        components.add(messageList);
        components.add(messageInput);
        components.add(main);
        components.add(mapComponent);
        components.add(popover);
        components.add(sideNav);
        components.add(nativeLabel);
        components.add(reactRouterOutlet);
        components.add(fieldSet);
        components.add(dashboard);
        components.add(markdown);

        layouts.add(formLayout);
        layouts.add(verticalLayout);
        layouts.add(horizontalLayout);
        layouts.add(flexLayout);
        layouts.add(splitLayout);
        layouts.add(splitVertical);
        layouts.add(tabs);
        layouts.add(tabSheet);
        layouts.add(masterDetailLayout);
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
                text = StringUtil.toUTF8String(stream);
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
