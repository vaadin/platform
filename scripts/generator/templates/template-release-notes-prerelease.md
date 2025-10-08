Vaadin {{platform}}

[Upgrading](https://vaadin.com/docs/upgrading ) · [Docs](https://vaadin.com/docs/) · [Get Started](https://vaadin.com/docs/latest/getting-started/start)

*This is a pre-release for the Vaadin 25.0. We appreciate if you give it a try and [report any issues](https://github.com/vaadin/platform/issues/new) you notice. To use this release, you'll need to have following repositories declared in your  project (Vaadin pre-releases are not pushed to Maven central) :*

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

**Major Breaking Changes Since Vaadin 24**
Vaadin 25 is under developing at the moment, the full migration guide will come when it gets close to beta release. 
Thanks for your patience. For now, you can take the following link/contents as reference. 

- [Breaking changes in flow](https://github.com/vaadin/platform/issues/7691)
- Design System
  - removed `Cookie Consent` ([link](https://github.com/vaadin/web-components/pull/10027))
  - removed `overlayClass` property/ `setOverlayClassName` method ([link](https://github.com/vaadin/web-components/pull/9926)) 

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
