Vaadin {{platform}}

[Changelogs](#_changelogs) · [Upgrading guides](#_upgrading_guides) · [Docs](https://vaadin.com/docs/latest/) · [Get Started](https://vaadin.com/start/)

## New and Noteworthy Since Vaadin 24.3

### Vaadin Copilot

We are glad to introduce you a handy development tool that’s ready to assist you whenever you run an application in development mode, **Vaadin Copilot**. Copilot is a visual development tool and an AI-empowered assistant. You can inspect and edit the UI, and use generative AI to help with a variety of tasks.

Vaadin Copilot is present by default while working with your project in development mode.

### Unified Vaadin Platform

The Hilla framework has been more closely integrated with the Vaadin platform. Vaadin BOM and Vaadin Spring Boot Starter now include the Hilla framework stating from version 24.4. This enables Vaadin users to choose between Flow and Hilla, or mix both frameworks when necessary.

### Flow
- **Mixing Flow and Hilla views in one single application**
   [Docs](https://vaadin.com/docs/next/flow/integrations/hilla) · [Example Project](https://github.com/vaadin/flow-hilla-hybrid-example/tree/v24.4)

  - Vaadin project can now have both server-side and client-side routes, written in Java or React, aka Flow views and Hilla views respectively. This doesn't need any special configuration, Vaadin Flow uses the React Router by default, adds all needed React dependencies and React components, provided by Vaadin.

- **Using React components from Flow**
   [Docs](https://vaadin.com/docs/next/flow/integrations/react)

  - You can wrap any React component as a Flow component and use it in your Flow view, change the component's state and send events from server to client and vice-versa. 

- **Using Flow components from React**
   [Docs](https://vaadin.com/docs/next/hilla/guides/flow-component-in-hilla)

  - Flow components can be embedded in a Hilla/React view by using a known `WebComponentExporter` API and using the exported Web component on the React view

- **Use React Router by default**
  [Docs](https://vaadin.com/docs/next/flow/configuration/maven#properties) 

  - Vaadin Flow uses [React Router](https://reactrouter.com/en/main/start/overview) by default, which gives an opportunity to start adding React components/views immediately into Vaadin application and develop in React.

- **Move /frontend directory under /src/main by default**
  - Vaadin uses `src/main/frontend/` directory as a default location of frontend resources, which is more natural for Maven projects. It fallbacks to `frontend` directory if the `src/main/frontend/` does not exist. 

### Hilla

- **Hilla File Router**

  The file-system based router, `@vaadin/hilla-file-router`, was added to Hilla. It simplifies adding React views to applications by automaticaly mapping files in the `src/main/frontend/views/` directory as routes, eliminating the step of editing the URL mapping for each added view. The Hilla file router is based on the React Router library.

- **Automatic Main Menu**

  The file router includes the `createMenuItems()` utility function, which enables populating the menu items in the React main layout. Hilla file router views and Java classes with the `@Menu` annotation are added as the menu items automatically.

- **Hilla React Signals**

  The new library for managing state in React applications, `@vaadin/hilla-react-signals`, was added to Hilla. Signals provide robust and convenient way of subscribing to state updates in UI, and allow to easily share the state updates between multiple components. The API of Hilla React signals follows the Preact Signals library.

### Design System
- Checkbox
  - Support for read-only state in Checkbox and Checkbox Group.
  - Support for helper-text in Checkbox (including individual checkboxes in a Checkbox Group), and support for required state (incl. indicator) and error message in individual Checkboxes.
- Grid
  - API for removing Grid header rows  
- Grid-Pro
  - An API in Grid for dynamically setting whether a cell is editable. (Similar e.g. to PartNameGenerator and TooltipGenerator) 
- MenuBar
  - support for reverse collapsing order
    - An option to have Menu Bar buttons collapse into the overflow menu starting from the left (start) end of the bar instead of the right (end) end of the bar.
- SideNav
  - API for configuring a link in SideNav to open in a new browser window/tab.
  - SideNav query parameter support
- TextArea 
  - API for programmatically setting the scroll position of Text Area to top or bottom.
- Upload
  - File name property added to Upload progress and rejected events 
    - The Upload component's FileRejectedEvent and ProgressUpdateEvent were missing a way to get the name of the file that that the event was about. This has now been addressed by the addition of a getFileName() API in both.    


## <a id="_changelogs"></a> Changelogs

- Flow ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}})) and Hilla ([{{core.hilla.javaVersion}}](https://github.com/vaadin/hilla/releases/tag/{{core.hilla.javaVersion}}))
- Design System
  - Web Components ([{{core.accordion.jsVersion}}](https://github.com/vaadin/web-components/releases/tag/v{{core.accordion.jsVersion}}))
  - Flow Components ([{{platform}}](https://github.com/vaadin/flow-components/releases/tag/{{platform}}))
- Designer ([Release notes](https://github.com/vaadin/designer/blob/master/RELEASE-NOTES.md))
- Design System Publisher ([Documentation](https://vaadin.com/design-system-publisher))
- TestBench ([{{vaadin.vaadin-testbench.javaVersion}}](https://github.com/vaadin/testbench/releases/tag/{{vaadin.vaadin-testbench.javaVersion}}))
- Classic Components([{{vaadin.vaadin-classic-components.javaVersion}}](https://github.com/vaadin/classic-components/releases/tag/{{vaadin.vaadin-classic-components.javaVersion}}))
- Multiplatform Runtime (MPR) ([{{core.mpr-v8.javaVersion}}](https://github.com/vaadin/multiplatform-runtime/releases/tag/{{core.mpr-v8.javaVersion}}))
- Router ([{{core.vaadin-router.jsVersion}}](https://github.com/vaadin/vaadin-router/releases/tag/v{{core.vaadin-router.jsVersion}}))
- Vaadin Kits
  - Azure Kit ([{{kits.azure-kit.version}}](https://vaadin.com/docs/latest/tools/azure))
  - Collaboration Engine ([{{kits.vaadin-collaboration-engine.javaVersion}}](https://github.com/vaadin/collaboration-engine/releases/tag/{{kits.vaadin-collaboration-engine.javaVersion}}))
  - Copilot ([{{kits.copilot.javaVersion}}](https://github.com/vaadin/copilot/releases/tag/{{kits.copilot.javaVersion}}))
  - Kubernetes Kit ([{{kits.kubernetes-kit-starter.javaVersion}}](https://github.com/vaadin/kubernetes-kit/releases/tag/{{kits.kubernetes-kit-starter.javaVersion}}))
  - Observability Kit ([{{kits.observability-kit-starter.javaVersion}}](https://github.com/vaadin/observability-kit/releases/tag/{{kits.observability-kit-starter.javaVersion}}))
  - SSO Kit ([{{kits.sso-kit-starter.javaVersion}}](https://github.com/vaadin/sso-kit/releases/tag/{{kits.sso-kit-starter.javaVersion}}))
  - Swing Kit ([{{kits.swing-kit.javaVersion}}](https://vaadin.com/docs/latest/tools/swing))

**Official add-ons and plugins:**

- Spring add-on ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}}))
- CDI add-on ([{{core.flow-cdi.javaVersion}}](https://github.com/vaadin/cdi/releases/tag/{{core.flow-cdi.javaVersion}}))
- Maven plugin ({{platform}})
- Gradle plugin ({{platform}})
- Quarkus plugin ([{{core.vaadin-quarkus.javaVersion}}](https://github.com/vaadin/quarkus/releases/tag/{{core.vaadin-quarkus.javaVersion}}))

## <a id="_upgrading_guides"></a> Upgrading guides

- [Upgrading Flow to Vaadin 24](https://vaadin.com/docs/latest/flow/upgrading/changes/#changes-in-vaadin-24)
- [Upgrading Fusion to Vaadin 24](https://vaadin.com/docs/latest/fusion/upgrading/changes/#changes-in-vaadin-24)
- [Upgrading Design System to Vaadin 24](https://vaadin.com/docs/latest/ds/upgrading)



## Support
Vaadin 24 is the latest stable version, with extended support options available ([release model](https://vaadin.com/roadmap)).


<!-- Non-LTS:

Vaadin 24 is supported for one month after Vaadin 25 has been released ([release model](https://vaadin.com/roadmap)).

-->
Vaadin also provides [commercial support and warranty](https://vaadin.com/solutions/support).



## Supported technologies

<table>
<tr>
  <th>Desktop browser</th>
  <td>

- Chrome (evergreen)
- Firefox (evergreen)
   - Firefox Extended Support Release (ESR)
- Safari 15 or newer
- Edge (Chromium, evergreen)
  </td>
</tr>
<tr>
  <th>Mobile browser</th>
  <td>

- Chrome (evergreen) for Android (4.4 or newer)
- Safari for iOS (15 or newer)
  </td>
</tr>
<tr>
  <th>Development OS</th>
  <td>

- Windows
- macOS
- Linux
</td>
</tr>
<tr>
  <th>IDE</th>
  <td>

Any IDE or editor that works with the language of your choice should work well. Our teams often use Eclipse, IntelliJ, VS Code, Atom, Emacs, and Vim, among others.

Vaadin Designer supports the following IDEs:
- Eclipse from Photon and upwards
- JetBrains IntelliJ IDEA from 2017 upwards
  </td>
</tr>
<tr>
  <th>Java</th>
  <td>Version 17 of any JDK or JRE</td>
</tr>
<tr>
  <th>Maven</th>
  <td>Version 3.5 or newer</td>
</tr>
<tr>
  <th>Gradle</th>
  <td>Version 8.5 or newer</td>
</tr>
<tr>
  <th>Application server</th>
  <td>

Vaadin Flow requires Java Servlet API 6 and Java 17 or newer. It is tested on:

- Apache Tomcat 10.1
- Open Liberty 23.0.0.1-beta
- RedHat JBoss EAP 8.0 beta
- WildFly 27
- Jetty 12 beta
- Payara Server 6
- Payara Micro 6
  </td>
</tr>
<tr>
  <th>Node.js</th>
  <td>Version 18 or newer</td>
</tr>
<tr>
  <th>Spring Boot</th>
  <td>Version 3.2 or newer
  </td>
</tr>
</table>



## Known issues and limitations

<table>
<tr>
  <th>Flow</th>
  <td>

- The Template-in-Template feature has [some limitations](https://github.com/vaadin/flow/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+label%3Atemplate-in-template+)
  </td>
</tr>
</table>
