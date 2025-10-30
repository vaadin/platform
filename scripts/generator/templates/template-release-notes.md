Vaadin {{platform}}

[Changelogs](#_changelogs) · [Upgrading guides](#_upgrading_guides) · [Docs](https://vaadin.com/docs/latest/) · [Get Started](https://vaadin.com/start/)

## New and Noteworthy Since Vaadin 23.6

### Flow
-
### Hilla
- 
  
### Design System
- 

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
