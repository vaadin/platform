Vaadin {{platform}}

[Upgrading](https://vaadin.com/docs/upgrading ) · [Docs](https://vaadin.com/docs/) · [Get Started](https://vaadin.com/docs/latest/getting-started/start)

# New and Noteworthy Since Vaadin 24

**Notable Changes**

### Flow

## Hilla

## Design System

## Copilot

## Modernization

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
  - Azure Kit ([{{kits.azure-kit.version}}](https://vaadin.com/docs/latest/tools/azure-cloud ))
  - Collaboration Engine ([{{kits.vaadin-collaboration-engine.javaVersion}}](https://github.com/vaadin/collaboration-kit/releases/tag/{{kits.vaadin-collaboration-engine.javaVersion}}))
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
- Safari 17 or newer (latest minor version in each major series).
- Edge (Chromium, evergreen).
  </td>
</tr>
<tr>
  <th>Mobile browser</th>
  <td>

- Chrome (evergreen) for Android (4.4 or newer).
- Safari 17 for iOS or newer (latest minor version in each major series).
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
  <td>Version 21 of any JDK or JRE</td>
</tr>
<tr>
  <th>Maven</th>
  <td>Version 3.5 or newer</td>
</tr>
<tr>
  <th>Gradle</th>
  <td>Version 8.14 or newer</td>
</tr>
<tr>
  <th>Application server</th>
  <td>

Vaadin Flow requires Java Servlet API 6 and Java 17 or newer. It is tested on:

- Apache Tomcat 10.1
- Open Liberty 23
- RedHat JBoss EAP 8.1
  - To work with RedHat JBoss EAP 8.0, you will need to add the following content to the `jboss-deployment-structure.xml` placed under `WEB-INF` folder
  <details>
    <summary>Workaround for supporting RedHat JBoss EAP 8.0</summary>
    
   ```xml
    <jboss-deployment-structure>
      <deployment>
        <exclude-subsystems>
          <subsystem name="jaxrs" />
        </exclude-subsystems>
      </deployment>
    </jboss-deployment-structure>
   ```
   
  </details> 
- WildFly 35
- Jetty 12
- Payara Server 6
- Payara Micro 6
  </td>
</tr>
<tr>
  <th>Node.js</th>
  <td>Version 24 or newer</td>
</tr>
<tr>
  <th>Spring Boot</th>
  <td>Version 4.0 or newer
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
