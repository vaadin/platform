import { LitElement } from 'lit-element';

export class View extends LitElement {
  createRenderRoot() {
    // Do not use a shadow root
    return this;
  }
}
