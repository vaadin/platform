Vaadin {{platform}}

[Changelogs](#_changelogs) · [Upgrading guides](#_upgrading_guides) · [Docs](https://vaadin.com/docs/latest/) · [Get Started](https://vaadin.com/start/)

*This is a pre-release for the Vaadin 24.4. We appreciate if you give it a try and [report any issues](https://github.com/vaadin/platform/issues/new) you notice. To use this release, you'll need to have following repositories declared in your  project (Vaadin pre-releases are not pushed to Maven central) :*

    <repositories>
        <repository>
            <id>vaadin-prereleases</id>
            <url>
                https://maven.vaadin.com/vaadin-prereleases/
            </url>
        </repository>
    </repositories>

    <pluginRepositories>
        <pluginRepository>
            <id>vaadin-prereleases</id>
            <url>
                https://maven.vaadin.com/vaadin-prereleases/
            </url>
        </pluginRepository>
    </pluginRepositories>

## New and Noteworthy Since Vaadin 24.3

### Vaadin Copilot

We are glad to introduce you a handy development tool that’s ready to assist you whenever you run an application in development mode, **Vaadin Copilot**. Copilot is a visual development tool and an AI-powered assistant. You can inspect and edit the UI, and use generative AI to help with a variety of tasks.

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

<!-- Remove the ones that do not contain any changes/updates -->

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
  - AppSec Kit ([{{kits.appsec-kit-starter.javaVersion}}](https://vaadin.com/docs/latest/tools/appsec))
  - Azure Kit ([{{kits.azure-kit.version}}](https://vaadin.com/docs/latest/tools/azure))
  - Collaboration Engine ([{{kits.vaadin-collaboration-engine.javaVersion}}](https://github.com/vaadin/collaboration-engine/releases/tag/{{kits.vaadin-collaboration-engine.javaVersion}}))
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
