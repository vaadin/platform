Vaadin {{platform}}

[Upgrading](https://vaadin.com/docs/upgrading ) · [Docs](https://vaadin.com/docs/) · [Get Started](https://vaadin.com/docs/latest/getting-started/project)

# New and Noteworthy Since Vaadin 24.6

**Notable Changes**
- Due to the [issue](https://github.com/spring-projects/spring-framework/issues/33936) from spring framework, we recommend you to use Springboot 3.4.1 or newer to build Vaadin 24.7 project
- Vaadin 24.7 is compatible with React Router v7, when upgrading application from v24.6, please remove the opt-in feature flag, i.e.: `future={{ v7_startTransition: true }}`, from custom routing file.

### Flow
- **Change supported Node from 18 to 20**: Node 20 is the active LTS version for Node. Node 18 will be end of life soon and new libraries like React 19 support Node 20+
- **Fault-tolerant messaging for server-client communication**: This enhancement ensures reliable communication between server and client, improving the robustness of Vaadin applications.

## Hilla
- **File upload enhancements**: Improved file upload capabilities for Hilla applications.
- **React 19 support**: Ensures compatibility with the latest version of React, enabling modern front-end development.
- **Support for Kotlin Nullability in TypeScript Type Generation**: Enhances type safety between Kotlin and TypeScript.
- **Add way to disable/configure progress indicator**: Provides developers the flexibility to manage UI loading indicators.
- **Form validation fix in Kotlin**: Resolves issues with Hilla form validation in Kotlin projects.

## Design System
- **New Card Component and Dashboard Component**: Only the Web-Componentn and the React implementations.
- **Add conditional selection of grid items in Grid**: Enhances the flexibility of data grid operations.
- **Allow configure min and max rows in Text-Area**: Offers better control over text input fields.
- **Implement HasEnabled interface in Upload**: Adds consistency to UI component enabling/disabling mechanisms.
- **Add folder drag&drop upload in Upload**: Improves user experience for file uploads by supporting folder operations.
- **Add support for Gantt chart**: New capability in Vaadin Charts to visually represent project schedules.
- **Spring Data API for Grid and ComboBox**: Simplifies connecting Vaadin components to Spring Data repositories.
- **Improvements to core layouts**.

## Copilot
- **React 19 support**.
- **Custom Components**.
- **Customizable Palette**: Provides an enhanced developer experience with a customizable command palette.
- **Impersonation - quick user switching**: Facilitates easier testing and management of user roles by allowing quick user switching.
- **Show a dismissable notification when a variable is renamed**: Improves user feedback mechanisms in the IDE.

## Control Center
- **Control Center GA**: version 1.2 is a major milestone marking the general availability of Control Center.
- **Log viewer**: Introduces a new feature for viewing and analyzing application logs directly within Control Center, streamlining debugging and monitoring processes.
- **Passkey (WebAuthn) authentication**: Adds enhanced security with support for WebAuthn, allowing users to authenticate using passkeys.
- **Automated domain name updates**
- **Automated Certificate Creation and Renewal**
- **Environment variable management** for enhanced application configuration flexibility.

## Modernization
- **Feature Pack**: Wider Vaadin 7 component and API support.

## <a id="_changelogs"></a> Changelogs

- Flow ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}})) and Hilla ([{{core.hilla.javaVersion}}](https://github.com/vaadin/hilla/releases/tag/{{core.hilla.javaVersion}}))
- Design System
  - Web Components ([{{core.accordion.jsVersion}}](https://github.com/vaadin/web-components/releases/tag/v{{core.accordion.jsVersion}}))
  - Flow Components ([{{platform}}](https://github.com/vaadin/flow-components/releases/tag/{{platform}}))
- TestBench ([{{vaadin.vaadin-testbench.javaVersion}}](https://github.com/vaadin/testbench/releases/tag/{{vaadin.vaadin-testbench.javaVersion}}))
- Feature Pack([{{vaadin.vaadin-feature-pack.javaVersion}}](https://vaadin.com/docs/latest/tools/modernization-toolkit/feature-pack))
- Modernization Toolkit ([Documentation](https://vaadin.com/docs/latest/tools/modernization-toolkit))
  - Feature Pack ([Documentation](https://vaadin.com/docs/latest/tools/modernization-toolkit/feature-pack))
  - Dragonfly ([Documentation](https://vaadin.com/docs/latest/tools/modernization-toolkit/dragonfly))
  - Modernization Toolkit Analyzer ([Analyzer for Eclipse](https://vaadin.com/docs/latest/tools/modernization-toolkit/analyzer-for-eclipse), [Analyzer for Maven](https://vaadin.com/docs/latest/tools/modernization-toolkit/analyzer-for-maven))
- Multiplatform Runtime (MPR) ([{{core.mpr-v8.javaVersion}}](https://github.com/vaadin/multiplatform-runtime/releases/tag/{{core.mpr-v8.javaVersion}}))
- Router ([{{core.vaadin-router.jsVersion}}](https://github.com/vaadin/vaadin-router/releases/tag/v{{core.vaadin-router.jsVersion}}))
- Vaadin Kits
  - AppSec Kit ([{{kits.appsec-kit-starter.javaVersion}}](https://vaadin.com/docs/latest/tools/appsec))
  - Azure Kit ([{{kits.azure-kit.version}}](https://vaadin.com/docs/latest/tools/azure))
  - Collaboration Engine ([{{kits.vaadin-collaboration-engine.javaVersion}}](https://github.com/vaadin/collaboration-kit/releases/tag/{{kits.vaadin-collaboration-engine.javaVersion}}))
  - Control Center ([Documentation](https://vaadin.com/docs/latest/control-center))
  - Copilot ([{{kits.copilot.javaVersion}}](https://vaadin.com/docs/latest/tools/copilot))
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

- Chrome (evergreen).
- Firefox (evergreen).
   - Firefox Extended Support Release (ESR).
- Safari 15 or newer (latest minor version in each major series).
- Edge (Chromium, evergreen).
  </td>
</tr>
<tr>
  <th>Mobile browser</th>
  <td>

- Chrome (evergreen) for Android (4.4 or newer).
- Safari 15 for iOS or newer (latest minor version in each major series).
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

Any IDE or editor that works with the language of your choice should work well. Our teams often use IntelliJ, Eclipse, VS Code among others.

Vaadin IDE plugins (IntelliJ and VS Code) support the IDE versions released during the last 12 months

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
  <td>Version 8.7 or newer</td>
</tr>
<tr>
  <th>Application server</th>
  <td>

Vaadin Flow requires Java Servlet API 6 and Java 17 or newer. It is tested on:

- Apache Tomcat 10.1
- Open Liberty 23
- RedHat JBoss EAP 8.0 beta
- WildFly 35
- Jetty 12
- Payara Server 6
- Payara Micro 6
  </td>
</tr>
<tr>
  <th>Node.js</th>
  <td>Version 20 or newer</td>
</tr>
<tr>
  <th>Spring Boot</th>
  <td>Version 3.4 or newer
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
