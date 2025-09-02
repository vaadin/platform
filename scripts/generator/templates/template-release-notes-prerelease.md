Vaadin {{platform}}

[Upgrading](https://vaadin.com/docs/upgrading ) · [Docs](https://vaadin.com/docs/) · [Get Started](https://vaadin.com/docs/latest/getting-started/start)

*This is a pre-release for the Vaadin 24.9. We appreciate if you give it a try and [report any issues](https://github.com/vaadin/platform/issues/new) you notice. 

# New and Noteworthy Since Vaadin 24.8
Since Vaadin 24.9, you can start using Vaadin Beta and Release Candidate versions from **Maven Central**.
Flow:
  - add new HTML component `<code>`
  - add new style methods: `STYLE_BACKGROUND_POSITION`, `STYLE_BACKGROUND_SIZE`, `STYLE_FILTER`, `STYLE_GAP`, `STYLE_ROTATE`
  - add a short method to `SortDirection` enum (Thanks to @abdurasul29052002)
  - add convenient API to set item from DataView
  - Upgraded commercial trial experience ([read more](https://github.com/vaadin/platform/issues/7968))

Design System:
  - add `Tooltip` support for `SideNavItem`

Hilla:
  - support matching wildcard views with subdirectories

## Deprecation 

Flow:
  - Deprecate `HierarchyMapper`, `HierarchicalCommunicationController`, `HierarchicalArrayUpdater` and `HierarchicalUpdate`
  - Deprecate methods in `HierarchicalDataCommunicator` (listed [here](https://github.com/vaadin/flow/pull/21889))
  - Deprecate `webpackOutputDirectory`
  - Deprecate `VaadinSession::setConfiguration(configuraiton)`
  - Deprecate `setRequestedRange` and `computeRequestedRange`
  - Deprecate `VaadinWebSecurity `
  - Deprecate `arrayUpdater` and `dataupdater`

Design System:
  - Deprecate `CookieConsent`
  - Deprecate legacy `Grid` API (listed [here](https://github.com/vaadin/flow-components/pull/7692))
  - Deprecate `TreeGridElement`'s _getNumberOfExpandedRows_ and _isLoadingExpandedRows_

*Deprecated APIs will be removed in Vaadin 25

## Known Vulnerability 
Vaadin 24.9 uses Springboot 3.5.x which contain the `commons-lang3:3.17.0`, based on security scanners, [CVE-2025-48924](https://nvd.nist.gov/vuln/detail/CVE-2025-48924) will be reported. 
To get rid of this report, you can overwrite the dependency version by adding `<commons-lang3.version>3.18.0</commons-lang3.version>` to the property section in your pom.xml.
More info about missing the latest version of `commons-lang3` in spring boot 3.5.x bom can be found [here](https://github.com/spring-projects/spring-boot/issues/46437)

## <a id="_changelogs"></a> Changelogs

<!-- Remove the ones that do not contain any changes/updates -->

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
  - Control Center ([{{kits.control-center.javaVersion}}](https://vaadin.com/docs/latest/control-center))
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
