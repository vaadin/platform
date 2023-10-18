Vaadin {{platform}}

[Changelogs](#_changelogs) · [Upgrading guides](#_upgrading_guides) · [Docs](https://vaadin.com/docs/latest/) · [Get Started](https://vaadin.com/start/)

## New and Noteworthy Since Vaadin 24.1

### Flow
- Server-side API for Web Push Notifications
  - Vaadin provides an API in Flow to send [Web Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) from the server to the client's browsers.
   Read more about Web Push API in our [online documentation](https://vaadin.com/docs/latest/configuration/setting-up-webpush#create-webpushservice) and try [base starter](https://github.com/vaadin/base-starter-flow-webpush) or [CRM example project](https://github.com/vaadin/flow-crm-tutorial/tree/feature/webpush), that shows how to store Web Push subscriptions in database.

- Gradle Incremental Build for Prepare Frontend
  - Defines the inputs and outputs for `vaadinPrepareFrontendTask` of Vaadin Gradle plugin making it possible to skip the task and reduce build time in development mode if _inputs_ and _outputs_ are not changed, e.g. if project configuration not changed and no clean-up made, giving `UP-TO-DATE` result, according to incremental builds feature.

    Read more about this feature in our [online documentation](https://vaadin.com/docs/latest/guide/start/gradle#incremental.builds).

- Faster server reloads for Spring-based applications
  -  Server reload time in Vaadin 24.2 is less by ~53% in average than for Vaadin 24.1, which gives a better developer experience for live-reload of Java changes.
  
- Dev Tools plugin support
  -  You can implement a Dev Tools plugin, when you run in development mode. See [documentation](https://vaadin.com/docs/latest/configuration/development-mode/dev-tools/dev-tools-plugin-support) for more details.

Check [Flow 24.2.0 release notes](https://github.com/vaadin/flow/releases/tag/24.2.0) for more infos about this release .

### Design System
- Support for SVG and font icons ([Documentation](https://vaadin.com/docs/latest/components/icons#using-third-party-icons))
- Custom content slots in Login component ([Documentation](https://vaadin.com/docs/latest/components/login#custom-form-area))
- Side Navigation component improved and stable ([Documentation](https://vaadin.com/docs/latest/components/side-nav))
- API for marking Grid cells as row headers
  - New API in Grid for defining which columns' cells should be marked up as headers for their rows, in order to improve usability with screen readers. See https://github.com/vaadin/web-components/issues/5321 for more details.
- Common Java interface for input field components
  - A generic Java interface for input field components, combining all of the functional interfaces they have in common. See https://github.com/vaadin/platform/issues/4489 for more details
- Java API for getting splitter position of SplitLayout ([Documentation](https://vaadin.com/docs/latest/components/split-layout#splitter-position))

### Addons
- AI Form Filler Addon *
  - Automatically fills Flow UI components from unstructured data (Raw Natural Language Text)
  - Most of the Flow Components supported (included Grid)
  - Built-in prompt engineering - ready to use
  - Multilingual Support (both input and output)
  - API to add more context instructions for the AI model
  - API to add instructions to give extra information to the AI model about a specific field
  - Documentation under Tools section https://vaadin.com/docs/latest/tools/ai-form-filler 

### Kits
- AppSec kit for Vaadin 24 project **
  - Identify and manage vulnerabilities in Vaadin app dependencies
  - [Documentation](https://vaadin.com/docs/latest/tools/appsec)


*Experimental content
**AppSec Kit for Vaadin 24 will be added to vaadin-bom in 24.2.1. 

## Known Vulnerability
- [CVE-2023-42795, CVE-2023-45648]
  - This vulnerable dependency, `org.apache.tomcat.embed/tomcat-embed-core@10.1.13`, is a transitive depndency from Spring Boot (<3.1.5), which will be fixed in the following Vaadin release, after new spring boot (3.1.5, scheduled on 19th Oct, 2023) release. 
- [[CVE-2023-35116](https://nvd.nist.gov/vuln/detail/CVE-2023-35116)]
  - This is a **DISPUTED** report. The dependency, `com.fasterxml.jackson.core/jackson-databind@2.15.2`,  will be updated in the next vaadin maintenance release. 
- [[CVE-2023-4586](https://nvd.nist.gov/vuln/detail/CVE-2023-4586)]
  - This has been identified as a [False-Positive report](https://github.com/jeremylong/DependencyCheck/issues/5912). The affected version will be fixed in the next vaadin maintenance release. 
- CVEs regarding form-filler-addon 1.0.x
  - This is a [false positive report](https://github.com/jeremylong/DependencyCheck/pull/5927) by the owasp plugin, suppression has been sent to `dependency-check-maven` plugin and it will be included in the next maintenance release (8.4.1)

## <a id="_changelogs"></a> Changelogs

- Flow ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}})) 
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
  - Observability Kit ([{{kits.observability-kit-starter.javaVersion}}](https://github.com/vaadin/observability-kit/releases/tag/{{kits.observability-kit-starter.javaVersion}}))
  - SSO Kit ([{{kits.sso-kit-starter.javaVersion}}](https://github.com/vaadin/sso-kit/releases/tag/{{kits.sso-kit-starter.javaVersion}}))
  - Swing Kit ([{{kits.swing-kit.javaVersion}}](https://vaadin.com/docs/latest/tools/swing))
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

<table>
<tr>
  <th>Flow</th>
  <td>

- The Template-in-Template feature has [some limitations](https://github.com/vaadin/flow/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+label%3Atemplate-in-template+)
  </td>
</tr>
</table>
