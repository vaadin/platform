import '@vaadin/accordion';
import '@vaadin/accordion/src/vaadin-accordion-panel';
import '@vaadin/app-layout';
import '@vaadin/app-layout/src/vaadin-drawer-toggle';
import '@vaadin/avatar';
import '@vaadin/avatar-group';
import '@vaadin/board';
import '@vaadin/board/src/vaadin-board-row';
import '@vaadin/card';
import '@vaadin/icon';
import '@vaadin/scroller';
import '@vaadin/virtual-list';
import '@vaadin/board/vaadin-board';
import '@vaadin/board/vaadin-board-row';
import '@vaadin/button';
import '@vaadin/charts';
import '@vaadin/charts/src/vaadin-chart';
import '@vaadin/checkbox';
import '@vaadin/checkbox-group';
import '@vaadin/combo-box';
import '@vaadin/multi-select-combo-box';
import '@vaadin/confirm-dialog';
import '@vaadin/crud';
import '@vaadin/crud/src/vaadin-crud-edit-column';
import '@vaadin/dashboard';
import '@vaadin/dashboard/src/vaadin-dashboard-section';
import '@vaadin/dashboard/src/vaadin-dashboard-widget';
import '@vaadin/date-time-picker';
import '@vaadin/date-picker';
import '@vaadin/details';
import '@vaadin/email-field';
import '@vaadin/form-layout';
import '@vaadin/grid';
import '@vaadin/grid-pro';
import '@vaadin/grid-pro/src/vaadin-grid-pro-edit-column';
import '@vaadin/grid/src/vaadin-grid-column';
import '@vaadin/grid/src/vaadin-grid-sorter';
import '@vaadin/grid/src/vaadin-grid-tree-toggle';
import '@vaadin/horizontal-layout';
import '@vaadin/icon/vaadin-icon';
import '@vaadin/icons/vaadin-iconset';
import '@vaadin/integer-field';
import '@vaadin/list-box';
import '@vaadin/login/src/vaadin-login-form';
import '@vaadin/login/src/vaadin-login-overlay';
import '@vaadin/map';
import '@vaadin/markdown';
import '@vaadin/master-detail-layout';
import '@vaadin/menu-bar';
import '@vaadin/message-input';
import '@vaadin/message-list';
import '@vaadin/number-field';
import '@vaadin/password-field';
import '@vaadin/popover';
import '@vaadin/progress-bar';
import '@vaadin/radio-group';
import '@vaadin/rich-text-editor';
import '@vaadin/scroller/vaadin-scroller';
import '@vaadin/side-nav';
import '@vaadin/side-nav/vaadin-side-nav-item.js';
import '@vaadin/side-nav/src/vaadin-side-nav-item';
import '@vaadin/split-layout';
import '@vaadin/tabs';
import '@vaadin/tabsheet';
import '@vaadin/tabs/src/vaadin-tab';
import '@vaadin/text-area';
import '@vaadin/text-field';
import '@vaadin/tooltip';
import '@vaadin/upload';
import '@vaadin/upload/src/vaadin-upload-button';
import '@vaadin/upload/src/vaadin-upload-drop-zone';
import '@vaadin/upload/src/vaadin-upload-file-list';
import '@vaadin/vertical-layout';
import '@vaadin/virtual-list/vaadin-virtual-list';
import '@vaadin/context-menu';
import '@vaadin/dialog';
import '@vaadin/notification';
import '@vaadin/select';
import '@vaadin/time-picker';

import type {
  VirtualList,
  VirtualListItemModel,
} from '@vaadin/virtual-list';
import type {
  Dashboard,
  DashboardItemModel,
} from '@vaadin/dashboard';
import type {
  DashboardWidget,
} from '@vaadin/dashboard/vaadin-dashboard-widget';
import { html, css, } from 'lit';
import { customElement, query} from 'lit/decorators.js';
import { View } from '../view';
import { LoginOverlay } from '@vaadin/login';

type Person = {
  name: string;
};

type CustomWidget = {
  title: string;
  content: string;
  id?: unknown;
  colspan?: number;
  rowspan?: number;
};

@customElement('components-view')
export class ComponentsView extends View {
  static get styles() {
    return css`
    `;
  }

  @query('vaadin-login-overlay')
  loginOverlay!: LoginOverlay;

  render() {
    return html`
      <div>I'm styled!</div>
      <vaadin-app-layout>
        <header>header</header>
        <vaadin-accordion>
          <vaadin-accordion-panel>
            <vaadin-accordion-heading slot="summary">summary</vaadin-accordion-heading>
            <div>accordion content</div>
          </vaadin-accordion-panel>
        </vaadin-accordion>
        <vaadin-avatar-group max="2" .items = "${[
            {name: 'Foo Bar', colorIndex: 1},
            {colorIndex: 2},
            {name: 'Foo Bar', colorIndex: 3}
         ]}" ></vaadin-avatar-group>
        <vaadin-avatar abbr="SK" name="Jens Jansson"></vaadin-avatar>
        <vaadin-board>
          <vaadin-board-row board-cols="4"><label>Board</label></vaadin-board-row>
          <vaadin-board-row>
            <div class="top a" board-cols="2">top aA</div>
            <div class="top b">top B</div>
            <div class="top c">top C</div>
          </vaadin-board-row>
          <vaadin-board-row>
            <div class="mid">mid</div>
          </vaadin-board-row>
          <vaadin-board-row>
            <div class="low a">low A</div>
            <vaadin-board-row>
              <div class="top a">low B / A</div>
              <div class="top b">low B / B</div>
              <div class="top c">low B / C</div>
              <div class="top d">low B / D</div>
            </vaadin-board-row>
          </vaadin-board-row>
        </vaadin-board>

        <vaadin-button theme="primary" id="confirm">Primary</vaadin-button>
        <vaadin-tooltip text="Click to save changes" for="confirm"></vaadin-tooltip>
        <vaadin-button theme="secondary">Secondary</vaadin-button>
        <vaadin-button theme="tertiary">Tertiary</vaadin-button>

        <vaadin-card>
          <div slot="title">Lapland</div>
          <div slot="subtitle">The Exotic North</div>
          <div>Lapland is the northern-most region of Finland and an active outdoor destination.</div>
        </vaadin-card>

        <vaadin-icon name="vaadin:user"></vaadin-icon>
        <vaadin-iconset name="foo" size="16">
          <svg><defs>
            <g id="foo:bar"><path d="M0 0v16h16v-16h-16zM14 2v3h-0.1c-0.2-0.6-0.8-1-1.4-1s-1.2 0.4-1.4 1h-3.2c-0.2-0.6-0.7-1-1.4-1s-1.2 0.4-1.4 1h-0.2c-0.2-0.6-0.7-1-1.4-1s-1.2 0.4-1.4 1h-0.1v-3h12zM13.9 10c-0.2-0.6-0.8-1-1.4-1s-1.2 0.4-1.4 1h-0.2c-0.2-0.6-0.8-1-1.4-1s-1.2 0.4-1.4 1h-3.2c-0.2-0.6-0.7-1-1.4-1s-1.2 0.4-1.4 1h-0.1v-4h0.1c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h0.2c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h3.2c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h0.1l-0.1 4zM2 14v-3h0.1c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h3.2c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h0.2c0.2 0.6 0.8 1 1.4 1s1.2-0.4 1.4-1h0.1v3h-12z"></path></g>
          </defs></svg>
        </vaadin-iconset>
        <vaadin-icon name="foo:bar"></vaadin-icon>

        <vaadin-chart type="pie">
        <vaadin-chart-series .values="${[
              ["Firefox", 45.0],
              ["IE", 26.8],
              ["Chrome", 12.8],
              ["Safari", 8.5],
              ["Opera", 6.2],
              ["Others", 0.7]]}">
          </vaadin-chart-series>
        </vaadin-chart>
        <vaadin-checkbox-group label="Label" theme="vertical">
          <vaadin-checkbox value="1" label="Option one" checked></vaadin-checkbox>
          <vaadin-checkbox value="2" label="Option two"></vaadin-checkbox>
          <vaadin-checkbox value="3" label="Option three"></vaadin-checkbox>
        </vaadin-checkbox-group>
        <vaadin-combo-box .items="${[1,2,3,4,5]}"></vaadin-combo-box>
        <vaadin-multi-select-combo-box .items="${['apple', 'banana', 'lemon', 'orange']}"></vaadin-multi-select-combo-box>
        <vaadin-confirm-dialog></vaadin-confirm-dialog>
        <vaadin-context-menu
          open-on="click"
          .items="${[
            { text: "First menu item" },
            { text: "Second menu item" },
          ]}"
        >
          <p>Context Menu</p>
        </vaadin-context-menu>
        <vaadin-crud .items="${[{"name": "Juan", "surname": "Garcia"}]}">
        </vaadin-crud>

        <vaadin-crud .items="${[{"name": "Juan", "surname": "Garcia"}]}">
          <vaadin-grid slot="grid" >
            <vaadin-crud-edit-column></vaadin-crud-edit-column>
            <vaadin-grid-column path="name"></vaadin-grid-column>
            <vaadin-grid-column path="surname"></vaadin-grid-column>
          </vaadin-grid>
        </vaadin-crud>

        <vaadin-dashboard
          .items="${[{ title: 'Widget 1', content: 'Content 1'}, { title: 'Widget 2', content: 'Content 2'}]}"
          .renderer="${(
            root: HTMLElement,
            _dashboard: Dashboard<CustomWidget>,
            model: DashboardItemModel<CustomWidget>
          ) => {
              const widget: DashboardWidget = <DashboardWidget>root.firstElementChild || document.createElement('vaadin-dashboard-widget');
              root.appendChild(widget);
              widget.widgetTitle = model.item.title;
              widget.textContent = model.item.content;
          }}"
        ></vaadin-dashboard>
        <vaadin-dashboard-widget></vaadin-dashboard-widget>
        <vaadin-dashboard-section></vaadin-dashboard-section>
        <vaadin-date-picker></vaadin-date-picker>
        <vaadin-date-time-picker></vaadin-date-time-picker>
        <vaadin-details>
          <vaadin-details-summary slot="summary">Summary</vaadin-details-summary>
          <div>Details</div>
        </vaadin-details>
        <vaadin-dialog></vaadin-dialog>
        <vaadin-select></vaadin-select>
        <vaadin-time-picker></vaadin-time-picker>
        <vaadin-drawer-toggle></vaadin-drawer-toggle>
        <vaadin-form-layout>
          <vaadin-text-field></vaadin-text-field>
          <vaadin-password-field></vaadin-password-field>
          <vaadin-email-field></vaadin-email-field>
          <vaadin-integer-field></vaadin-integer-field>
          <vaadin-number-field></vaadin-number-field>
          <vaadin-text-area></vaadin-text-area>
        </vaadin-form-layout>
        <vaadin-markdown></vaadin-markdown>

        <vaadin-grid-sorter></vaadin-grid-sorter>
        <vaadin-grid-tree-toggle></vaadin-grid-tree-toggle>

        <vaadin-grid-pro .items="${[{firstName: 'M', lastName: 'C', email: 'e@a'}]}">
          <vaadin-grid-pro-edit-column path="firstName" header="First Name"></vaadin-grid-pro-edit-column>
          <vaadin-grid-pro-edit-column path="lastName" header="Last Name"></vaadin-grid-pro-edit-column>
          <vaadin-grid-pro-edit-column path="email" header="Email"></vaadin-grid-pro-edit-column>
        </vaadin-grid-pro>

        <vaadin-grid theme="row-dividers" column-reordering-allowed multi-sort
          .items="${[{firstName: 'M', lastName: 'C', email: 'e@a'},
                     {firstName: 'S', lastName: 'Y', email: 'a@e'}]}">
          <vaadin-grid-selection-column auto-select frozen></vaadin-grid-selection-column>
          <vaadin-grid-sort-column width="9em" path="firstName"></vaadin-grid-sort-column>
          <vaadin-grid-sort-column width="9em" path="lastName"></vaadin-grid-sort-column>
          <vaadin-grid-column path="email" width="15em" flex-grow="2" header="Address"></vaadin-grid-column>
        </vaadin-grid>

        <vaadin-vertical-layout>
          <vaadin-horizontal-layout>
            <h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>
          </vaadin-horizontal-layout>
          <vaadin-scroller>
            <header>Header</header>
            <div>DIV</div>
            <footer>Footer</footer>
          </vaadin-scroller>
        </vaadin-vertical-layout>

        <vaadin-list-box selected="2">
          <b>Select an Item</b>
          <vaadin-item>Item one</vaadin-item>
          <vaadin-item>Item two</vaadin-item>
          <hr>
          <vaadin-item>Item three</vaadin-item>
          <vaadin-item>Item four</vaadin-item>
        </vaadin-list-box>

        <vaadin-login-form></vaadin-login-form>

        <vaadin-button @click="${this.openLoginOverlay}">Open Login Overlay</vaadin-button>
        <vaadin-login-overlay></vaadin-login-overlay>

        <vaadin-progress-bar indeterminate></vaadin-progress-bar>

        <vaadin-popover></vaadin-popover>

        <vaadin-master-detail-layout>
          <div>Master content</div>
          <div slot="detail">Detail content</div>
        </vaadin-master-detail-layout>

        <vaadin-menu-bar .items="${[
            {text: 'Home'},
            {text: 'Dashboard'},
            {text: 'Content'},
            {text: 'Help'}
        ]}"></vaadin-menu-bar>

        <vaadin-radio-group label="Label" theme="vertical">
          <vaadin-radio-button label="Option one" checked></vaadin-radio-button>
          <vaadin-radio-button label="Option two"></vaadin-radio-button>
          <vaadin-radio-button label="Option three"></vaadin-radio-button>
        </vaadin-radio-group>

        <vaadin-rich-text-editor></vaadin-rich-text-editor>

        <vaadin-side-nav collapsible>
          <span slot="label">Main menu</span>
          <vaadin-side-nav-item path="/1">Nav Item 1</vaadin-side-nav-item>
          <vaadin-side-nav-item path="/2">
            Nav Item 2
            <vaadin-side-nav-item path="/2/1" slot="children">Nav Item 2 - 1</vaadin-side-nav-item>
            <vaadin-side-nav-item path="/2/2" slot="children">Nav Item 2 - 2</vaadin-side-nav-item>
          </vaadin-side-nav-item>
        </vaadin-side-nav>

        <vaadin-split-layout>
          <div><vaadin-button>RIGHT</vaadin-button></div>
          <div><vaadin-button>LEFT</vaadin-button></div>
        </vaadin-split-layout>

        <vaadin-tabsheet>
          <vaadin-tabs slot="tabs">
            <vaadin-tab id="tab-1">Tab 1</vaadin-tab>
            <vaadin-tab id="tab-2">Tab 2</vaadin-tab>
            <vaadin-tab id="tab-3">Tab 3</vaadin-tab>
          </vaadin-tabs>

          <div tab="tab-1">Panel 1</div>
          <div tab="tab-2">Panel 2</div>
          <div tab="tab-3">Panel 3</div>
        </vaadin-tabsheet>

        <vaadin-upload></vaadin-upload>
        <vaadin-upload-button></vaadin-upload-button>
        <vaadin-upload-drop-zone></vaadin-upload-drop-zone>
        <vaadin-upload-file-list></vaadin-upload-file-list>

        <vaadin-message foo="bar"></vaadin-message>
        <vaadin-message-input></vaadin-message-input>
        <vaadin-message-list></vaadin-message-list>

        <div>-</div>
      </vaadin-app-layout>

      <vaadin-notification
        opened
        duration="-1"
        .renderer="${(root: HTMLElement) => {
          root.innerHTML = `
          <div>
            <b>Notice</b><br>
            Content
          </div>
        `;
        }}"
      ></vaadin-notification>

      <vaadin-map></vaadin-map>

      <vaadin-virtual-list
        .items="${[{ name: 'Juan' }, { name: 'John' }]}"
        .renderer="${(
          root: HTMLElement,
          _list: VirtualList<Person>,
          model: VirtualListItemModel<Person>
        ) => (root.textContent = `Name: ${model.item.name}`)}"
      >
      </vaadin-virtual-list>
    `;
  }

  openLoginOverlay() {
    this.loginOverlay.opened = true;
  }
}
