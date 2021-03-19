import { DomModule } from "@polymer/polymer/lib/elements/dom-module";
import { stylesFromTemplate } from "@polymer/polymer/lib/utils/style-gather";
import { CSSResult, unsafeCSS } from "lit-element";

/**
 * Utility function for importing style modules. This is a temporary
 * solution until there is a standard solution available
 * @see https://github.com/vaadin/vaadin-themable-mixin/issues/73
 *
 * @param id the style module to import
 */
export const CSSModule = (id: string): CSSResult => {
  const template: HTMLTemplateElement | null = DomModule.import(
    id,
    "template"
  ) as HTMLTemplateElement;
  const cssText =
    template &&
    stylesFromTemplate(template, "")
      .map((style: HTMLStyleElement) => style.textContent)
      .join(" ");
  return unsafeCSS(cssText);
};