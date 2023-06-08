Vaadin {{platform}}

[Changelogs](#_changelogs) · [Upgrading guides](#_upgrading_guides) · [Docs](https://vaadin.com/docs/latest/) · [Get Started](https://vaadin.com/start/)

## New and Noteworthy Since Vaadin 24.0

**Notable Changes**

Gradle support is raised to the version (Gradle 7.6) required by [jackson](https://github.com/FasterXML/jackson-core/issues/955)

### Flow
- Pre-compiled frontend bundle for production builds
  - Vaadin uses a pre-compiled frontend bundle enabling building Vaadin Flow projects for production more quickly without installing Node.js and npm dependencies. This is an extension of frontend dev bundle feature, introduced in Vaadin 24.0, but for production builds.
- Production Bundle Loading Optimizations
  - A production build scans for Routes and lazy loads the components used in the routes when navigated.
  - [documentation](https://vaadin.com/docs/latest/production/production-build)
- Hot Module Redeployment
  - Allows changing styles immediately without page reload
see [release note](https://github.com/vaadin/flow/releases/tag/24.1.0) for all features

### Classic Components
- The rendering performance of the Classic GridLayout has been enhanced for large/huge grids.

### Hilla
- Hilla Gradle Plugin [documentation](https://hilla.dev/docs/lit/start/gradle)
  
### Design System
- New **SideNav** component (released under feature flag)
  - If you have a project using `vcf-nav` it is recommended to migrate to `vaadin-side-nav`.
- New **Map** features
  - Styleable label for markers [documentation](https://vaadin.com/docs/latest/components/map/#marker-text)
  - Drag and drop markers [documentation](https://vaadin.com/docs/latest/components/map/#marker-drag-drop)
- Warning color in **Lumo** theme
- Warning **Notification** theme variant
- **Accessibility** improvements
  - Flow component APIs for setting aria-label and aria-labelledby
  - Optional borders around input fields
- **TreeGrid** hierarchical scrollToIndex


### Kits
- 
`*` experimental

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
  - Kubernetes Kit ([{{kits.kubernetes-kit-starter.javaVersion}}](https://github.com/vaadin/kubernetes-kit/releases/tag/{{kits.kubernetes-kit-starter.javaVersion}}))
  - Observability Kit ([{{kits.observability-kit.version}}](https://github.com/vaadin/observability-kit/releases/tag/{{kits.observability-kit.version}}))
  - SSO Kit ([Documentation](https://vaadin.com/docs/latest/tools/sso))
  - Swing Kit ([{{kits.swing-kit.version}}](https://vaadin.com/docs/latest/tools/swing))
- Designer ([Release notes](https://github.com/vaadin/designer/blob/master/RELEASE-NOTES.md))

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
<!-- New LTS:

Vaadin 24 is the latest stable version, with extended support options available ([release model](https://vaadin.com/roadmap)).

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
- Safari 15.6 or newer
- Edge (Chromium, evergreen)
  </td>
</tr>
<tr>
  <th>Mobile browser</th>
  <td>

- Chrome (evergreen) for Android (4.4 or newer)
- Safari for iOS (15.6 or newer)
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
  <td>Version 7.3 or newer</td>
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
  <td>Version 3.0 or newer
  </td>
</tr>
</table>



## Known issues and limitations

#### Flow
- The Template-in-Template feature has [some limitations](https://github.com/vaadin/flow/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+label%3Atemplate-in-template+).
- That if you see the error <em>'An import path can only end with a `.ts` extension ...'</em>, then you can add `allowImportingTsExtensions: true` to `tsconfig.json`.
