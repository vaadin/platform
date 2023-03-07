Vaadin {{platform}}

[Changelogs](#_changelogs) · [Upgrading guides](#_upgrading_guides) · [Docs](https://vaadin.com/docs/latest/) · [Get Started](https://vaadin.com/start/)

## New and Noteworthy Since Vaadin 23

**Notable Changes**
- Java 17 is required instead of 11
- Safari 14 support is dropped. All iOS devices can be upgraded from Safari 14 to 15
- Weblogic + TomEE is not supported or tested as there is no version available for Jakarta EE 10
- Karaf or OSGI is not supported as OSGi standards are still lacking servlet 6 support
- Portlets are not supported as portlet standards are still lacking servlet 6 support
- Some servers are still in beta with their Jakarta EE 10 support but are still tested
- Node.js support is raised to the current LTS (Node 18) to avoid future problems
- Gradle support is raised to the version (Gradle 7.3) introducing Java 17 support
- Spring Boot 2 is not supported

### Flow
- New development mode with faster start-up (aka Express Build mode)
- Polymer to Lit conversion tool
- Support for JUnit 5 in TestBench
- Support for Spring AOT Native Image Compilation
- Helper methods for Component
- Svg component
- Dev tools improvements:
  - find where components are created and attached in code by clicking in UI
    utils for opening a file in the IDE running the application
(Flow upgrade guide can be found from [here](https://vaadin.com/docs/next/upgrading))

### Hilla
- Multi-Module Engine
  - default setting, no feature flag any more
- Reactive Endpoints [docs](https://hilla.dev/docs/lit/guides/reactive-endpoints)
- AOT Native Image Compilation
  - Faster startup and lower memory requirements compared to running with JVM
- React Starter with Authentication
  - Starting React Hilla project with login form and access control for views

### Design System
- Theming improvements [docs](https://vaadin.com/docs/next/styling)
- Spreadsheet new features [docs](https://vaadin.com/docs/next/components/spreadsheet)
  - Embedded components
  - Embedded Charts 
- GridPro custom editor value provider 
  - Allows converting the model value into the appropriate type or format used by the editor
- Validation enhancements
  – Server-side validation is triggered on blur
  – Binder takes into account component constraints
  – Entering bad input invalidates the field


### Acceleration Kits
- SSO Kit for Hilla
  - Supported providers are Keycloak, Okta and Azure AD
  - Login through the provider
  - Access to the user information
  - In-app logout (RP-initiated)
  - Backchannel logout with notification dialog about the logout
  - Both Hilla Lit and React are supported
  
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
  - Collaboration Engine ([{{kits.vaadin-collaboration-engine.javaVersion}}](https://github.com/vaadin/collaboration-engine/releases/tag/{{vaadin.vaadin-collaboration-engine.javaVersion}}))
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
- Quarkus plugin ([{{core.vaadin-quarkus.javaVersion}}](https://github.com/vaadin/quarkus/releases/tag/{{core.vaadin-quarkus.javaVersion}}))

## <a id="_upgrading_guides"></a> Upgrading guides

- [Upgrading Vaadin 23 to Vaadin 24](https://vaadin.com/docs/next/upgrading)


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
  <td>Maven 3.8.2 and 3.8.3 are not suggested to use as the known issue mentioned in https://maven.apache.org/docs/3.8.4/release-notes.html</td>
</tr>
<tr>
  <th>Gradle</th>
  <td>Version 7.5 or newer</td>
</tr>
<tr>
  <th>Application server</th>
  <td>

Vaadin Flow requires Java Servlet API 6 and Java 17 or newer. It is tested on:

- Apache Tomcat 10.1
- Open Liberty 23.0.0.1-beta
- RedHat JBoss EAP 8.0 beta
- WildFly 27
- Jetty 11 (currently Jetty 12 beta is not working)
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

<table>
<tr>
  <th>Flow</th>
  <td>

- The Template-in-Template feature has [some limitations](https://github.com/vaadin/flow/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+label%3Atemplate-in-template+)
  </td>
</tr>
</table>

## Known Vulnerability

TestBench brings the dependency `pkg:maven/com.google.guava/guava@31.1-jre`, that has the vulnerability described in [CVE-2020-8908](https://github.com/advisories/GHSA-5mg8-w23w-74h3), the problematic method has been [deprecated in guava](https://github.com/google/guava/issues/4011) and it is not used in Vaadin.
