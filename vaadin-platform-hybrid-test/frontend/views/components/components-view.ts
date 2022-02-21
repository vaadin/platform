import '@vaadin/accordion';
import '@vaadin/app-layout';
import '@vaadin/app-layout/src/vaadin-drawer-toggle';
import '@vaadin/avatar';
import '@vaadin/avatar-group';
import '@vaadin/board/vaadin-board';
import '@vaadin/board/vaadin-board-row';
import '@vaadin/button';
import '@vaadin/charts';
import '@vaadin/charts/src/vaadin-chart';
import '@vaadin/checkbox';
import '@vaadin/checkbox-group';
import '@vaadin/confirm-dialog';
import '@vaadin/cookie-consent';
import '@vaadin/crud';
import '@vaadin/crud/src/vaadin-crud-edit-column';
import '@vaadin/date-time-picker';
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
import '@vaadin/menu-bar';
import '@vaadin/message-input';
import '@vaadin/message-list';
import '@vaadin/number-field';
import '@vaadin/password-field';
import '@vaadin/polymer-legacy-adapter/style-modules';
import '@vaadin/polymer-legacy-adapter/template-renderer';
import '@vaadin/progress-bar';
import '@vaadin/radio-group';
import '@vaadin/rich-text-editor';
import '@vaadin/scroller/vaadin-scroller';
import '@vaadin/split-layout';
import '@vaadin/tabs';
import '@vaadin/tabs/src/vaadin-tab';
import '@vaadin/text-area';
import '@vaadin/text-field';
import '@vaadin/upload';
import '@vaadin/vertical-layout';
import '@vaadin/virtual-list/vaadin-virtual-list';

import type {
  VirtualList,
  VirtualListItemModel,
} from '@vaadin/virtual-list';
import { html, css, } from 'lit-element';
import { customElement, query} from 'lit/decorators.js';
import { View } from '../view';
import { LoginOverlay } from '@vaadin/login';

type Person = {
  name: string;
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
            <div slot="summary">summary</div>
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

        <vaadin-button theme="primary">Primary</vaadin-button>
        <vaadin-button theme="secondary">Secondary</vaadin-button>
        <vaadin-button theme="tertiary">Tertiary</vaadin-button>

        <vaadin-icons></vaadin-icons>
        <iron-icon icon="vaadin:airplane"></iron-icon>

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
          <vaadin-checkbox value="1" checked>Option one</vaadin-checkbox>
          <vaadin-checkbox value="2">Option two</vaadin-checkbox>
          <vaadin-checkbox value="3">Option three</vaadin-checkbox>
        </vaadin-checkbox-group>
        <vaadin-combo-box .items="${[1,2,3,4,5]}"></vaadin-combo-box>
        <vaadin-confirm-dialog></vaadin-confirm-dialog>
        <vaadin-context-menu open-on="click">
          <template>
            <vaadin-list-box>
              <vaadin-item>First menu item</vaadin-item>
              <vaadin-item>Second menu item</vaadin-item>
            </vaadin-list-box>
          </template>
          <p>Context Menu</p>
        </vaadin-context-menu>
        <vaadin-cookie-consent></vaadin-cookie-consent>
        <vaadin-crud .items="${[{"name": "Juan", "surname": "Garcia"}]}">
        </vaadin-crud>

        <vaadin-crud .items="${[{"name": "Juan", "surname": "Garcia"}]}">
          <vaadin-grid slot="grid" >
            <vaadin-crud-edit-column></vaadin-crud-edit-column>
            <vaadin-grid-column path="name"></vaadin-grid-column>
            <vaadin-grid-column path="surname"></vaadin-grid-column>
          </vaadin-grid>
        </vaadin-crud>


        <vaadin-date-time-picker></vaadin-date-time-picker>
        <vaadin-details></vaadin-details>
        <vaadin-drawer-toggle></vaadin-drawer-toggle>
        <vaadin-form-layout>
          <vaadin-text-field></vaadin-text-field>
          <vaadin-password-field></vaadin-password-field>
          <vaadin-email-field></vaadin-email-field>
          <vaadin-integer-field></vaadin-integer-field>
          <vaadin-number-field></vaadin-number-field>
          <vaadin-text-area></vaadin-text-area>
        </vaadin-form-layout>

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

        <vaadin-menu-bar .items="${[
            {text: 'Home'},
            {text: 'Dashboard'},
            {text: 'Content'},
            {text: 'Help'}
        ]}"></vaadin-menu-bar>

        <vaadin-radio-group label="Label" theme="vertical">
          <vaadin-radio-button checked>Option one</vaadin-radio-button>
          <vaadin-radio-button>Option two</vaadin-radio-button>
          <vaadin-radio-button>Option three</vaadin-radio-button>
        </vaadin-radio-group>

        <vaadin-rich-text-editor></vaadin-rich-text-editor>
        <vaadin-split-layout>
          <div><vaadin-button>RIGHT</vaadin-button></div>
          <div><vaadin-button>LEFT</vaadin-button></div>
        </vaadin-split-layout>

        <vaadin-tabs>
          <vaadin-tab>Tab one</vaadin-tab>
          <vaadin-tab>Tab two</vaadin-tab>
          <vaadin-tab>Tab three</vaadin-tab>
        </vaadin-tabs>

        <vaadin-upload></vaadin-upload>

        <vaadin-message foo="bar"></vaadin-message>
        <vaadin-message-input></vaadin-message-input>
        <vaadin-message-list></vaadin-message-list>

        <div>-</div>
      </vaadin-app-layout>

      <vaadin-notification opened duration="-1">
        <template>
          <div>
            <b>Notice</b><br>
            Content
          </div>
        </template>
      </vaadin-notification>

      <style-modules></style-modules>
      <template-renderer></template-renderer>

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
