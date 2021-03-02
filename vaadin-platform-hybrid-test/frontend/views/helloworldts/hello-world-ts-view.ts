import { showNotification } from '@vaadin/flow-frontend/a-notification';
import '@vaadin/vaadin-button';
import '@vaadin/vaadin-text-field';
import { customElement, html } from 'lit-element';
import { View } from '../view';
import './hello-world-ts-view.global.css';

@customElement('hello-world-ts-view')
export class HelloWorldTSView extends View {
  name: string = '';

  render() {
    return html`
      <div>Hello World</div>
      <vaadin-text-field label="Your name" @value-changed="${this.nameChanged}"></vaadin-text-field>
      <vaadin-button @click="${this.sayHello}">Say hello</vaadin-button>
    `;
  }
  nameChanged(e: CustomEvent) {
    this.name = e.detail.value;
  }

  sayHello() {
    showNotification('Hello ' + this.name);
  }
}
