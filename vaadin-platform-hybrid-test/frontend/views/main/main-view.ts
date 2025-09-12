import { AppLayout } from '@vaadin/app-layout';
import '@vaadin/app-layout';
import '@vaadin/app-layout/vaadin-drawer-toggle';
import '@vaadin/avatar';
import '@vaadin/tabs';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js'
import { router } from '../../index';

interface MenuTab {
  route: string;
  name: string;
}

@customElement('main-view')
export class MainView extends LitElement {
  @property({ type: Object }) location = router.location;

  @property({ type: Array }) menuTabs: MenuTab[] = [
    { route: 'hello-ts', name: 'Hello World TS' },
    { route: 'hello-world', name: 'Hello World' },
    { route: 'components', name: 'Components' },
  ];

  @property({ type: String }) projectName = 'fusion-test';

  static get styles() {
    return [
      css`
        :host {
          display: block;
          height: 100%;
          margin: 1em;
        }

        header {
          align-items: center;
          box-shadow: var(--lumo-box-shadow-s);
          display: flex;
          height: var(--lumo-size-xl);
          width: 100%;
        }

        header h1 {
          font-size: var(--lumo-font-size-l);
          margin: 0;
        }

        header vaadin-avatar {
          margin-left: auto;
          margin-right: var(--lumo-space-m);
        }

        vaadin-app-layout[dir='rtl'] header vaadin-avatar {
          margin-left: var(--lumo-space-m);
          margin-right: auto;
        }

        #logo {
          align-items: center;
          box-sizing: border-box;
          display: flex;
          padding: var(--lumo-space-s) var(--lumo-space-m);
        }

        #logo img {
          height: calc(var(--lumo-size-l) * 1.5);
        }

        #logo span {
          font-size: var(--lumo-font-size-xl);
          font-weight: 600;
          margin: 0 var(--lumo-space-s);
        }

        vaadin-tab {
          font-size: var(--lumo-font-size-s);
          height: var(--lumo-size-l);
          font-weight: 600;
          color: var(--lumo-body-text-color);
        }

        vaadin-tab:hover {
          background-color: var(--lumo-contrast-5pct);
          text-decoration: none;
        }

        vaadin-tab[selected] {
          background-color: var(--lumo-primary-color-10pct);
          color: var(--lumo-primary-text-color);
        }

        hr {
          margin: 0;
        }
      `,
    ];
  }

  render() {
    return html`
      <vaadin-app-layout primary-section="drawer">
        <header slot="navbar" theme="dark">
          <vaadin-drawer-toggle></vaadin-drawer-toggle>
          <h1>${this.getSelectedTabName(this.menuTabs)}</h1>
          <vaadin-avatar></vaadin-avatar>
        </header>

        <div slot="drawer">
          <div id="logo">
            <img src="images/logo.png" alt="${this.projectName} logo" />
            <span>${this.projectName}</span>
          </div>
          <hr />
          <vaadin-tabs orientation="vertical" theme="minimal" id="tabs" .selected="${this.getIndexOfSelectedTab()}">
            ${this.menuTabs.map(
              (menuTab) => html`
                <vaadin-tab>
                  <a href="${router.urlForPath(menuTab.route)}" tabindex="-1">${menuTab.name}</a>
                </vaadin-tab>
              `
            )}
          </vaadin-tabs>
        </div>
        <slot></slot>
      </vaadin-app-layout>
    `;
  }

  private _routerLocationChanged() {
    AppLayout.dispatchCloseOverlayDrawerEvent();
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('vaadin-router-location-changed', this._routerLocationChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('vaadin-router-location-changed', this._routerLocationChanged);
  }

  private isCurrentLocation(route: string): boolean {
    return router.urlForPath(route) === this.location.getUrl();
  }

  private getIndexOfSelectedTab(): number {
    const index = this.menuTabs.findIndex((menuTab) => this.isCurrentLocation(menuTab.route));

    // Select first tab if there is no tab for home in the menu
    if (index === -1 && this.isCurrentLocation('')) {
      return 0;
    }

    return index;
  }

  private getSelectedTabName(menuTabs: MenuTab[]): string {
    const currentTab = menuTabs.find((menuTab) => this.isCurrentLocation(menuTab.route));
    let tabName = '';
    if (currentTab) {
      tabName = currentTab.name;
    } else {
      tabName = 'Hello World TS';
    }
    return tabName;
  }
}
