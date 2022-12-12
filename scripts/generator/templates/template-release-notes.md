Vaadin {{platform}}

[Changelogs](#_changelogs) · [Upgrading guides](#_upgrading_guides) · [Docs](https://vaadin.com/docs/latest/) · [Get Started](https://vaadin.com/start/)

## New and Noteworthy Since Vaadin 23.2

NOTE: Since Vaadin 23.3, Vaadin Commercial license and Service Terms has been updated. Read [more](https://vaadin.com/commercial-license-and-service-terms) 

### Flow
- Preserve on refresh: add refresh flag to navigation events
  _Adds the `isRefreshEvent` flag to `BeforeEnterEvent` and `AfterNavigationEvent` to distinguish if the event is for refresh on the view with `@PreserveOnRefresh`_
- Better Vite compilation logs
- Allow setting content of the Html component
  _Adds `Html::setHtmlContent()` to sets the content based on the given HTML fragment (thanks @TatuLund !)_ 
- Rerouting to external URL
  _Redirects to the given URL in `BeforeEnterEvent::forwardToUrl()` even if the servlet is deployed with a non-root context path_
- Use new `auto-configuration` in spring-boot
- Auto-update of the tsconfig
  _Auto-updates `tsconfig.json` in the project and gives a descriptive message to the developer asking to add custom changes manually (if any)_
- Gradle plugin: Filtering dependencies during prepare frontend task
  _Speeds up the prepare frontend task execution for the cases when the number of dependencies of the project is very large and the types of dependencies are very different (thanks @mvysny !)_

### Hilla
- Hilla React
  - New starter CLI application presets based on React
  - @hilla/react-components npm package with wrappers of all Vaadin web components (excl. Map and Spreadsheet)
  - [Documentation](hilla.dev/docs/react/start/basics)
  
### Design System
- Stable **Spreadsheet** component for flow
- New component: **TabSheet**
- New component: **Tooltip** 
- **DatePicker**: 2-digit year parsing
- Shift-click for **Grid** multi-sort

### Vaadin Kits
- Collaboration Kit 
  _No new features, just internal changes needed for updating dependencies_
- Azure Kit
  _Azure Kit contains all the features of Kubernetes Kit, in addition it provides a set of blueprints to create and manage Azure clusters and resources by code_
- Kubernetes Kit 
  _Kubernetes Kit provides all the tools to deploy a Vaadin app to K8s and achieve auto-scaling and high-availability_
- Observability Kit 
  _Observability Kit lets you monitor your app performance_
- SSO Kit 
  _SSO Kit adds support for single sign-on in Vaadin apps_
- Swing Kit
  _Swing kit aims at enabling a phased approach migration from Swing into Vaadin, allowing Swing to include Vaadin views inside the main desktop application_ 

## <a id="_changelogs"></a> Changelogs

- Flow ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}})) and Hilla ([{{core.hilla.javaVersion}}](https://github.com/vaadin/hilla/releases/tag/{{core.hilla.javaVersion}}))
- Design System
  - Web Components ([{{core.vaadin-accordion.jsVersion}}](https://github.com/vaadin/web-components/releases/tag/v{{core.vaadin-accordion.jsVersion}}))
  - Flow Components ([{{platform}}](https://github.com/vaadin/flow-components/releases/tag/{{platform}}))
- TestBench ([{{vaadin.vaadin-testbench.javaVersion}}](https://github.com/vaadin/testbench/releases/tag/{{vaadin.vaadin-testbench.javaVersion}}))
- Classic Components([{{vaadin.vaadin-classic-components.javaVersion}}](https://github.com/vaadin/classic-components/releases/tag/{{vaadin.vaadin-classic-components.javaVersion}}))
- Multiplatform Runtime (MPR) ([{{core.mpr-v8.javaVersion}}](https://github.com/vaadin/multiplatform-runtime/releases/tag/{{core.mpr-v8.javaVersion}}))
- Router ([{{core.vaadin-router.jsVersion}}](https://github.com/vaadin/vaadin-router/releases/tag/v{{core.vaadin-router.jsVersion}}))
- Vaadin Kits
  - Collaboration Kit (aka Collaboration Engine) ([{{kits.vaadin-collaboration-engine.javaVersion}}](https://github.com/vaadin/collaboration-engine/releases/tag/{{vaadin.vaadin-collaboration-engine.javaVersion}}))  
  - Azure Kit ([{{kits.azure-kit.version}}](https://vaadin.com/docs/latest/tools/azure))
  - Kubernetes Kit ([{{kits.kubernetes-kit-starter.javaVersion}}](https://github.com/vaadin/kubernetes-kit/releases/tag/{{kits.kubernetes-kit-starter.javaVersion}}))
  - Observability Kit ([{{kits.observability-kit.version}}](https://github.com/vaadin/observability-kit/releases/tag/{{kits.observability-kit.version}}))
  - SSO Kit ([{{kits.sso-kit-starter.javaVersion}}](https://github.com/vaadin/sso-kit/releases/tag/{{kits.sso-kit-starter.javaVersion}}))
  - Swing Kit ([{{kits.swing-kit.version}}](https://vaadin.com/docs/latest/tools/swing))
- Designer ([Release notes](https://github.com/vaadin/designer/blob/master/RELEASE-NOTES.md))

**Official add-ons and plugins:**

- Spring add-on ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}}))
- CDI add-on ([{{core.flow-cdi.javaVersion}}](https://github.com/vaadin/cdi/releases/tag/{{core.flow-cdi.javaVersion}}))
- Maven plugin ({{platform}})
- Gradle plugin ({{platform}})
- OSGi plugin ([{{vaadin.flow-osgi.javaVersion}}](https://github.com/vaadin/osgi/releases/tag/{{vaadin.flow-osgi.javaVersion}}))
- Quarkus plugin ([{{core.vaadin-quarkus.javaVersion}}](https://github.com/vaadin/quarkus/releases/tag/{{core.vaadin-quarkus.javaVersion}}))
- Portlet plugin ([{{vaadin.vaadin-portlet.javaVersion}}](https://github.com/vaadin/portlet/releases/tag/{{vaadin.vaadin-portlet.javaVersion}}))

## <a id="_upgrading_guides"></a> Upgrading guides

- [Upgrading Flow to Vaadin 23](https://vaadin.com/docs/latest/flow/upgrading/changes/#changes-in-vaadin-23)
- [Upgrading Fusion to Vaadin 23](https://vaadin.com/docs/latest/fusion/upgrading/changes/#changes-in-vaadin-23)
- [Upgrading Design System to Vaadin 23](https://vaadin.com/docs/latest/ds/upgrading)



## Support
<!-- New LTS:

Vaadin 23 is the latest stable version, with extended support options available ([release model](https://vaadin.com/roadmap)).

-->

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
- Safari 14.1 or newer
- Edge (Chromium, evergreen)
  </td>
</tr>
<tr>
  <th>Mobile browser</th>
  <td>

- Chrome (evergreen) for Android (4.4 or newer)
- Safari for iOS (14.7 or newer)
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
  <td>Version 11, and 17 of any JDK or JRE</td>
</tr>
<tr>
  <th>Maven</th>
  <td>Version 3.5 or newer</td>
</tr>
<tr>
  <th>Gradle</th>
  <td>Version 5.0 or newer</td>
</tr>
<tr>
  <th>Application server</th>
  <td>

Vaadin Flow requires Java Servlet API 3.1 (JSR-340) and JDK11 or newer. It is tested on:

- Apache Tomcat 8.0.x, 8.5, 9
- Apache TomEE 8.0
- Oracle WebLogic Server 14c
- IBM WebSphere Application Server v9.0.5 Liberty Profile
- RedHat JBoss EAP 7.2
- WildFly 15, 16
- Jetty 9.4
- Payara Server (platform 5.194)
- Payara Micro (platform 5.194)
- Karaf 4.2 or newer
  </td>
</tr>
<tr>
  <th>Node.js</th>
  <td>Version 16.15 or newer</td>
</tr>
<tr>
  <th>Spring Boot</th>
  <td>Vaadin 23.3 requires Spring Boot 2.7</td>  
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
