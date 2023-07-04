Vaadin {{platform}}

*This is a maintenance release for Vaadin 23.3. See [23.3.0 release notes](https://github.com/vaadin/platform/releases/tag/23.3.0) for details and resources.*

**Notable Changes**
- Since Vaadin 23.3, the minimal supported spring.boot.version is 2.7.x
- Since Vaadin 23.3.5, due to the founded vulnerability ([CVE-2022-1471](https://nvd.nist.gov/vuln/detail/CVE-2022-1471)), dependency for `org.yaml:snakeyaml` has been removed. 
  - Vaadin project is not depending on the vulnerable dependency (`org.yaml:snakeyaml`) directly, users can add the dependency if needed 
- Vaadin 23.3.x depends on Spring framework 5.3.x, which has been identified with vulnerability CVE-2016-1000027
  - as the faulty code has been deprecated in spring framework 5.3.x, Vaadin 23.3 project is NOT affected.

## Changelogs

<!-- Remove the ones that do not contain any changes/updates -->

- Flow ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}})) and Hilla ([{{core.hilla.javaVersion}}](https://github.com/vaadin/hilla/releases/tag/{{core.hilla.javaVersion}}))
- Design System
  - Web Components ([{{core.vaadin-accordion.jsVersion}}](https://github.com/vaadin/web-components/releases/tag/v{{core.vaadin-accordion.jsVersion}}))
  - Flow Components ([{{platform}}](https://github.com/vaadin/flow-components/releases/tag/{{platform}}))
- TestBench ([{{vaadin.vaadin-testbench.javaVersion}}](https://github.com/vaadin/testbench/releases/tag/{{vaadin.vaadin-testbench.javaVersion}}))
- Classic Components([{{vaadin.vaadin-classic-components.javaVersion}}](https://github.com/vaadin/classic-components/releases/tag/{{vaadin.vaadin-classic-components.javaVersion}}))
- Multiplatform Runtime (MPR) ([{{core.mpr-v8.javaVersion}}](https://github.com/vaadin/multiplatform-runtime/releases/tag/{{core.mpr-v8.javaVersion}}))
- Router ([{{core.vaadin-router.jsVersion}}](https://github.com/vaadin/vaadin-router/releases/tag/v{{core.vaadin-router.jsVersion}}))
- Vaadin Kits
  - Collaboration Kit (aka Collaboration Engine) ([{{kits.vaadin-collaboration-engine.javaVersion}}](https://github.com/vaadin/collaboration-engine/releases/tag/{{kits.vaadin-collaboration-engine.javaVersion}})) 
  - Azure Kit ([{{kits.azure-kit.version}}](https://vaadin.com/docs/latest/tools/azure))
  - Kubernetes Kit ([{{kits.kubernetes-kit-starter.javaVersion}}](https://github.com/vaadin/kubernetes-kit/releases/tag/{{kits.kubernetes-kit-starter.javaVersion}}))
  - Observability Kit ([{{kits.observability-kit.version}}](https://github.com/vaadin/observability-kit/releases/tag/{{kits.observability-kit.version}}))
  - SSO Kit ([{{kits.sso-kit-starter.javaVersion}}](https://github.com/vaadin/sso-kit/releases/tag/{{kits.sso-kit-starter.javaVersion}}))
  - Swing Kit ([{{kits.swing-kit.version}}](https://vaadin.com/docs/latest/tools/swing))
- Designer ([Release notes](https://github.com/vaadin/designer/blob/master/RELEASE-NOTES.md))
- Design System Publisher ([Documentation](https://vaadin.com/design-system-publisher))

**Official add-ons and plugins:**

- Spring add-on ({{core.flow.javaVersion}})
- CDI add-on ([{{core.flow-cdi.javaVersion}}](https://github.com/vaadin/cdi/releases/tag/{{core.flow-cdi.javaVersion}}))
- Maven plugin ({{platform}})
- Gradle plugin ({{platform}})
- OSGi plugin ([{{vaadin.flow-osgi.javaVersion}}](https://github.com/vaadin/osgi/releases/tag/{{vaadin.flow-osgi.javaVersion}}))
- Quarkus plugin ([{{core.vaadin-quarkus.javaVersion}}](https://github.com/vaadin/quarkus/releases/tag/{{core.vaadin-quarkus.javaVersion}}))
- Portlet plugin ([{{vaadin.vaadin-portlet.javaVersion}}](https://github.com/vaadin/portlet/releases/tag/{{vaadin.vaadin-portlet.javaVersion}}))

