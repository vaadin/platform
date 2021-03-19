import '@vaadin/vaadin-notification';

interface Options {
  position?: string;
  theme?: string;
  duration?: number;
}
export const showNotification = (
  text: string,
  options: Options = { position: "middle" }
) => {
  _showNotification(text, options);
};

export const showErrorNotification = (
  text: string,
  options: Options = { position: "middle", duration: -1, theme: "error" }
) => {
  _showNotification(text, options);
};

const _showNotification = (text: string, options: Options) => {
  const n: any = document.createElement("vaadin-notification");
  const tpl = document.createElement("template");
  const span = document.createElement("span");
  span.innerText = text;
  tpl.content.appendChild(span);
  n.appendChild(tpl);
  document.body.appendChild(n);
  n.opened = true;
  n.addEventListener("opened-changed", (e: any) => {
    if (!e.detail.opened) {
      document.body.removeChild(n);
    }
  });
  n._container.addEventListener("click", () => {
    n.opened = false;
  });

  if (options.theme) {
    n.setAttribute("theme", options.theme);
  }
  if (options.position) {
    n.position = options.position;
  }
  if (options.duration) {
    n.duration = options.duration;
  }

  return n;
};