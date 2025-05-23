import {
    Accordion,
    AccordionHeading,
    AccordionPanel,
    Avatar,
    AvatarGroup,
    Button,
    Checkbox,
    CheckboxGroup,
    ComboBox,
    ConfirmDialog,
    ContextMenu,
    DatePicker,
    DateTimePicker,
    Details,
    DetailsSummary,
    Dialog,
    DrawerToggle,
    EmailField,
    FormLayout,
    Grid,
    GridColumn,
    GridSelectionColumn,
    GridSortColumn,
    GridSorter,
    GridTreeToggle,
    HorizontalLayout,
    Icon,
    Iconset,
    IntegerField,
    Item,
    ListBox,
    LoginForm,
    LoginOverlay,
    MenuBar,
    Message,
    MessageInput,
    MessageList,
    MultiSelectComboBox,
    Notification,
    NumberField,
    PasswordField,
    Popover,
    ProgressBar, RadioButton, RadioGroup,
    Scroller,
    Select, SideNav, SideNavItem, SplitLayout, Tab,
    Tabs, TabSheet, TabSheetTab,
    TextArea,
    TextField,
    TimePicker,
    Tooltip,
    Upload,
    VerticalLayout,
    VirtualList,
    VirtualListItemModel
} from "@vaadin/react-components";
import type { ViewConfig } from "@vaadin/hilla-file-router/types.js";
import {
    Board,
    BoardRow,
    Chart,
    ChartSeries,
    CookieConsent,
    Crud,
    CrudEditColumn, Dashboard,
    GridPro,
    GridProEditColumn,
    RichTextEditor
} from "@vaadin/react-components-pro";

export const config: ViewConfig = {
    menu: {
        title: "React Components",
    }
};

export default function Components() {
    const openLoginOverlay = () => {
        // @ts-ignore
        document.getElementsByTagName("vaadin-login-overlay").item(0).opened = true;
    }

    return (
        <VerticalLayout theme="padding" id={"components"}>
            <Accordion>
                <AccordionPanel>
                    <AccordionHeading slot="summary">summary</AccordionHeading>
                    <div>accordion content</div>
                </AccordionPanel>
            </Accordion>
            <AvatarGroup maxItemsVisible={2} items={[
                {name: 'Foo Bar', colorIndex: 1},
                {colorIndex: 2},
                {name: 'Foo Bar', colorIndex: 3}
            ]}></AvatarGroup>
            <Avatar abbr="SK" name="Jens Jansson"></Avatar>
            <Board className="board-column-span">
                <BoardRow  {...{'board-cols': '4'}}><label>Board</label></BoardRow>
                <BoardRow>
                    <div className="cell"  {...{'board-cols': '2'}}>top aA</div>
                    <div className="cell">top B</div>
                    <div className="cell">top C</div>
                </BoardRow>
                <BoardRow>
                    <div className="cell mid">mid</div>
                </BoardRow>
                <BoardRow>
                    <div className="cell low a">low A</div>
                    <BoardRow>
                        <div className="cell top a">low B / A</div>
                        <div className="cell top b">low B / B</div>
                        <div className="cell top c">low B / C</div>
                        <div className="cell top d">low B / D</div>
                    </BoardRow>
                </BoardRow>
            </Board>

            <Button theme="primary" id="confirm">Primary</Button>
            <Tooltip text="Click to save changes" for="confirm"></Tooltip>
            <Button theme="secondary">Secondary</Button>
            <Button theme="tertiary">Tertiary</Button>

            <Icon icon="vaadin:user"></Icon>
            <Iconset name="foo" size={16}>
                <svg>
                    <defs>
                        <g id="foo:bar">
                            <path
                                d="M0 0v16h16v-16h-16zM14 2v3h-0.1c-0.2-0.6-0.8-1-1.4-1s-1.2 0.4-1.4 1h-3.2c-0.2-0.6-0.7-1-1.4-1s-1.2 0.4-1.4 1h-0.2c-0.2-0.6-0.7-1-1.4-1s-1.2 0.4-1.4 1h-0.1v-3h12zM13.9 10c-0.2-0.6-0.8-1-1.4-1s-1.2 0.4-1.4 1h-0.2c-0.2-0.6-0.8-1-1.4-1s-1.2 0.4-1.4 1h-3.2c-0.2-0.6-0.7-1-1.4-1s-1.2 0.4-1.4 1h-0.1v-4h0.1c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h0.2c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h3.2c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h0.1l-0.1 4zM2 14v-3h0.1c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h3.2c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h0.2c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h0.1v3h-12z"></path>
                        </g>
                    </defs>
                </svg>
            </Iconset>
            <Icon icon="foo:bar"></Icon>

            <Chart type="pie">
                <ChartSeries values={[
                    ["Firefox", 45.0],
                    ["IE", 26.8],
                    ["Chrome", 12.8],
                    ["Safari", 8.5],
                    ["Opera", 6.2],
                    ["Others", 0.7]]}>
                </ChartSeries>
            </Chart>
            <CheckboxGroup label="Label" theme="vertical">
                <Checkbox value="1" label="Option one" checked></Checkbox>
                <Checkbox value="2" label="Option two"></Checkbox>
                <Checkbox value="3" label="Option three"></Checkbox>
            </CheckboxGroup>
            <ComboBox items={[1, 2, 3, 4, 5]}></ComboBox>
            <MultiSelectComboBox
                items={['apple', 'banana', 'lemon', 'orange']}></MultiSelectComboBox>
            <ConfirmDialog></ConfirmDialog>
            <ContextMenu
                open-on="click"
                renderer={() => {
                    return (
                        <ListBox>
                            <Item>First menu item</Item>
                            <Item>Second menu item</Item>
                        </ListBox>
                    );
                }}
            >
                <p>Context Menu</p>
            </ContextMenu>
            <CookieConsent></CookieConsent>
            <Crud items={[{"name": "Juan", "surname": "Garcia"}]}>
            </Crud>

            <Crud items={[{"name": "Juan", "surname": "Garcia"}]}>
                <Grid slot="grid">
                    <CrudEditColumn></CrudEditColumn>
                    <GridColumn path="name"></GridColumn>
                    <GridColumn path="surname"></GridColumn>
                </Grid>
            </Crud>

            <DatePicker></DatePicker>
            <DateTimePicker></DateTimePicker>
            <Details>
                <DetailsSummary slot="summary">Summary</DetailsSummary>
                <div>Details</div>
            </Details>
            <Dialog></Dialog>
            <Select></Select>
            <TimePicker></TimePicker>
            <DrawerToggle></DrawerToggle>
            <FormLayout>
                <TextField></TextField>
                <PasswordField></PasswordField>
                <EmailField></EmailField>
                <IntegerField></IntegerField>
                <NumberField></NumberField>
                <TextArea></TextArea>
            </FormLayout>

            <GridSorter></GridSorter>
            <GridTreeToggle></GridTreeToggle>

            <GridPro items={[{firstName: 'M', lastName: 'C', email: 'e@a'}]}>
                <GridProEditColumn path="firstName"
                                   header="First Name"></GridProEditColumn>
                <GridProEditColumn path="lastName"
                                   header="Last Name"></GridProEditColumn>
                <GridProEditColumn path="email"
                                   header="Email"></GridProEditColumn>
            </GridPro>

            <Grid theme="row-dividers" column-reordering-allowed multi-sort
                  items={[{firstName: 'M', lastName: 'C', email: 'e@a'},
                      {firstName: 'S', lastName: 'Y', email: 'a@e'}]}>
                <GridSelectionColumn auto-select frozen></GridSelectionColumn>
                <GridSortColumn width="9em" path="firstName"></GridSortColumn>
                <GridSortColumn width="9em" path="lastName"></GridSortColumn>
                <GridColumn path="email" width="15em" flex-grow="2"
                            header="Address"></GridColumn>
            </Grid>

            <VerticalLayout>
                <HorizontalLayout>
                    <h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5>
                    <h6>H6</h6>
                </HorizontalLayout>
                <Scroller>
                    <header>Header</header>
                    <div>DIV</div>
                    <footer>Footer</footer>
                </Scroller>
            </VerticalLayout>

            <ListBox selectedValues={[2]}>
                <b>Select an Item</b>
                <Item>Item one</Item>
                <Item>Item two</Item>
                <hr></hr>
                <Item>Item three</Item>
                <Item>Item four</Item>
            </ListBox>

            <LoginForm></LoginForm>

            <Button onClick={() => openLoginOverlay()} id={"open-overlay"}>Open Login
                Overlay</Button>
            <LoginOverlay></LoginOverlay>

            <ProgressBar indeterminate></ProgressBar>

            <Popover></Popover>

            <MenuBar items={[
                {text: 'Home'},
                {text: 'Dashboard'},
                {text: 'Content'},
                {text: 'Help'}
            ]}></MenuBar>

            <RadioGroup label="Label" theme="vertical">
                <RadioButton label="Option one" checked></RadioButton>
                <RadioButton label="Option two"></RadioButton>
                <RadioButton label="Option three"></RadioButton>
            </RadioGroup>

            <RichTextEditor></RichTextEditor>

            <SideNav collapsible>
                <span slot="label">Main menu</span>
                <SideNavItem path="/1">Nav Item 1</SideNavItem>
                <SideNavItem path="/2">
                    Nav Item 2
                    <SideNavItem path="/2/1" slot="children">Nav Item 2 -
                        1</SideNavItem>
                    <SideNavItem path="/2/2" slot="children">Nav Item 2 -
                        2</SideNavItem>
                </SideNavItem>
            </SideNav>

            <SplitLayout>
                <div><Button>RIGHT</Button></div>
                <div><Button>LEFT</Button></div>
            </SplitLayout>

            <TabSheet>
                <TabSheetTab label={"Tab 1"}>
                    <div>Panel 1</div>
                </TabSheetTab>
                <TabSheetTab label={"Tab 2"}>
                    <div>Panel 2</div>
                </TabSheetTab>
                <TabSheetTab label={"Tab 3"}>
                    <div>Panel 3</div>
                </TabSheetTab>
            </TabSheet>

            <Tabs>
                <Tab>Tab 1</Tab>
                <Tab>Tab 2</Tab>
                <Tab>Tab 3</Tab>
            </Tabs>

            <Upload></Upload>

            <Message></Message>
            <MessageInput></MessageInput>
            <MessageList></MessageList>

            <Notification opened>
                    <div>
                        <b>Notice</b><br/>
                        Content
                    </div>
            </Notification>

            <VirtualList items={[{name: 'Juan'}, {name: 'John'}]}>
            </VirtualList>
            <Dashboard></Dashboard>
        </VerticalLayout>
    );
}
