# PRD: Content Security Policy support

> Draft for an issue in `vaadin/platform`, following the fields of
> `.github/ISSUE_TEMPLATE/prd.yml`. Not filed yet.

### Description

A `csp` mode setting — `off` (default, today's behaviour), `warn` (reports what would
break), `strict` (Vaadin serves a nonce-based policy and eval-requiring APIs throw).

### Tier

Free

### License

Apache 2.0

### Motivation

#### Background

A strict Content Security Policy (`script-src 'nonce-…'`, no `unsafe-inline`, no
`unsafe-eval`) is a standing requirement in banking, public sector, and anywhere a
security audit gates deployment. Vaadin sends server-initiated JavaScript to the
browser as strings that are compiled with `new Function` — exactly what `unsafe-eval`
forbids.

Since 24.5 a nonce-based policy is *possible*: the application adds an
`IndexHtmlRequestListener` that generates the nonce and puts it on the script tags,
overrides `window.Function` and `window.eval`, and hand-maintains a map from every
JavaScript string Vaadin, its components and its add-ons might send to a pre-defined
function. That is the documented approach today.

#### Problem

- **The workaround is not maintainable.** The map has to be rebuilt whenever Flow, a
  component or an add-on changes a snippet, and entries are discovered by watching
  console warnings at runtime. The reference application for it already breaks on
  server-side navigation (vaadin/flow-crm-tutorial#314).
- **The framework itself is not CSP-clean.** Five places in the client engine compile
  strings into functions: `executeJs` expressions, server-sent JS functions
  (vaadin/flow#24373), DOM event data expressions, DOM event filters, and on-demand
  chunk loading. Flow has ~100 `executeJs` call sites and the components ~60, so an
  application that writes no JavaScript of its own still cannot run strictly.
- **Nothing tells you where you stand.** Finding violations means enabling the policy
  in a browser and reading console errors that name generated JavaScript, not the Java
  code that caused it. There is no incremental path from "works" to "strict".
- **The same string concatenation is an XSS risk.** Building snippets by concatenating
  values into JavaScript is the failure mode declared JavaScript removes.

#### Solution

One setting that makes the state explicit:

- **`off`** (default) — exactly today's behaviour. No application sees a change.
- **`warn`** — the application runs unchanged, but every API call that would not work
  under a strict policy is logged, with the Java call site.
- **`strict`** — Vaadin generates the nonce and sends the header itself, and the APIs
  that cannot work throw instead of failing silently in the browser.

Plus the mechanism that makes `strict` reachable: JavaScript declared as constants in
Java, collected into the bundle by the build, invoked by naming the interface and
method rather than by sending a script (vaadin/flow#10759).

```java
@JsInvoker
public interface ScrollJs extends Serializable {
    @JsExpression("this.scrollTo({ top: $0, behavior: 'smooth' })")
    void scrollTo(int top);
}

container.getElement().getJsInvoker(ScrollJs.class).scrollTo(320);
```

#### Notes

`warn` is what makes the migration tractable — it turns "somewhere in this application
something uses eval" into a list. It is also the reason the mode is one setting with
three values rather than a boolean: the middle state is where applications and add-ons
will spend their time.

Staging: `off` and `warn` together with the declared-JavaScript mechanism and Flow's
own migration in 25.4. `strict` is announced as supported only once the core components
are migrated and the violation test is green.

### Requirements

- [ ] A `csp` mode setting (`off` | `warn` | `strict`), configured like other Vaadin
      settings (init parameter / Spring property), defaulting to `off`.
- [x] Declared JavaScript at element level: `@JsInvoker` interfaces whose
      `@JsExpression` methods the build collects into the bundle; an invocation names
      the interface and method instead of carrying a script (vaadin/flow#25749).
- [x] The same at page level, for JavaScript with no element behind it
      (vaadin/flow#25799).
- [ ] CSP-safe replacements for the remaining eval paths in the client engine:
      server-sent JS functions, DOM event data expressions, DOM event filters, and
      on-demand chunk loading.
- [ ] Flow's own server-initiated JavaScript goes through the declared mechanism.
      (`Focusable.focus()`/`blur()` done in vaadin/flow#25749.)
- [ ] Vaadin components work in `strict` mode, including their connectors — which means
      a connector declares its JavaScript as a module instead of publishing itself as
      `window.Vaadin.Flow.*` (vaadin/flow#25814).
- [ ] `warn` mode logs each call that `strict` would reject, naming the API and the
      application call site, with no change in behaviour — and works in development
      mode, where the code is written.
- [ ] `strict` mode generates a per-response nonce, sends the header, and puts the nonce
      on every script Vaadin adds, with no `IndexHtmlRequestListener` required from the
      application. A hook lets the application add or override directives it needs for
      its own resources (`connect-src`, `img-src`, `report-uri`, …).
- [ ] `strict` mode throws on the APIs that cannot work — `Element.executeJs`,
      `Page.executeJs`, `DomListenerRegistration.setFilter(String)`, string-based event
      data — so the failure happens in Java, at the call, not as a console error.
- [ ] `strict` in development mode applies the API restrictions but does not send the
      header, since the dev server and dev tools need `unsafe-eval`. Violations surface
      during development; the policy is enforced in production.
- [ ] The platform component test (`vaadin-platform-test`, `ComponentsView` /
      `ComponentsIT` at `/prod-mode/`) also runs in `strict` mode and fails on any CSP
      violation the browser reports.
- [ ] Documentation: the current article's `Function`/`eval` overriding recipe is
      replaced by the setting, the declared-JavaScript API, and a migration guide for
      applications and add-ons.

### Nice-to-haves

- [ ] `style-src` locked down as well, which needs the components to nonce or adopt the
      stylesheets they inject at runtime (vaadin/web-components#8031).
- [ ] `@JsInvoker` ergonomics: typed return values (vaadin/flow#25811) and an implicit
      `this.method()` shorthand (vaadin/flow#25812).
- [ ] `@JsInvoker` code split per chunk the way `@JsModule` imports are
      (vaadin/flow#25810).

### Risks, limitations and breaking changes

#### Risks

- The migration surface is the whole framework plus the component set (~170 call sites).
  A partially migrated `strict` looks like a broken framework rather than an unfinished
  migration — which is why `warn` and the violation test are requirements, not
  follow-ups.
- `warn` only sees calls that actually execute, so a code path no one exercises stays
  unreported. It lowers the cost of migration; it does not prove completeness.
- Add-ons and hand-written application JavaScript are outside Vaadin's control, so
  `strict` stays out of reach for some applications until those migrate.

#### Limitations

- In `strict` mode the header is sent in production mode only.
- Charts passes string-defined JavaScript functions to the client (`_fn_formatter`,
  `_fn_positioner`, …) where they are evaluated, and the Spreadsheet client calls
  `eval` during its GWT bootstrap. Neither is usable in `strict` mode until reworked;
  both are tracked separately from this PRD.

#### Breaking changes

- None by default: `off` is today's behaviour.
- In `strict` mode, `executeJs` and string-based event filters and event data throw.
  This is the point of the mode, and it is opt-in.
- From vaadin/flow#25749: `Focusable.focus()`/`blur()` no longer schedule a script
  string, so code or tests that read the scheduled JavaScript must read the invoker call
  instead; and every application's bundle is rebuilt once.

### Out of scope

- Trusted Types, and CSP directives unrelated to script execution beyond the
  application hook.
- A policy for the development server and dev tools.
- Migrating third-party add-ons.
- Hash-based policies and subresource integrity as an alternative to nonces.

### Materials

- vaadin/flow#10759 — the original design for declaring invokable JavaScript in Java
- vaadin/flow#25749, vaadin/flow#25799 — element-level and page-level implementation
- vaadin/flow#25814 — connectors as JS modules instead of `window.Vaadin.Flow.*`
- vaadin/flow#24373, vaadin/flow#10810 — earlier attempts at the same problem
- vaadin/flow-components#7935, vaadin/flow#20329 — individual CSP fixes already done
- Current documentation: `flow/security/advanced-topics/strict-csp`, and the reference
  application at `vaadin/flow-crm-tutorial@24.5-strict-csp`

### Metrics

- A new application using the standard components can set `strict` and run with zero
  CSP violations, without writing any JavaScript or an `IndexHtmlRequestListener`.
- Enabling `warn` on an existing application produces the complete list of what blocks
  `strict`, each entry pointing at a Java call site.
- The documentation article is the setting plus a migration guide — no overriding of
  `Function` or `eval`.

### Pre-implementation checklist

- [ ] Estimated (estimate entered into Estimate custom field)
- [ ] Product Manager sign-off
- [ ] Engineering Manager sign-off

### Pre-release checklist

- [ ] Documented (link to documentation provided in sub-issue or comment)
- [ ] UX/DX tests conducted and blockers addressed
- [ ] Approved for release by Product Manager

### Security review

Security audit conducted
