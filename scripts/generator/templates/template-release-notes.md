# Vaadin {{platform}}

Vaadin consists of a set of web components, a Java web framework, configurable themes, tools and a set of app templates.

Visit [vaadin.com](https://vaadin.com/) to get started.

## Support
Vaadin 14 is an LTS (long term support) version, which will be supported for 5 years after the GA (general availability) release. More details of our release model are available on our [roadmap page](https://vaadin.com/roadmap).

Vaadin also provides [commercial support and warranty](https://vaadin.com/support).

## New and Noteworthy Since 14.13
- 

{{componentNote}}
{{changesSincePrevious}}

## Included Projects and Change Log
Vaadin includes the following projects. Release notes with detailed change logs for each project are linked below.

Projects marked as **(Pro)** are available for users with [Pro](https://vaadin.com/pricing) or [Prime](https://vaadin.com/pricing) subscriptions. Everything else is free and open source.

### Components
{{components}}

### Themes
- Vaadin Lumo theme ([v{{core.vaadin-lumo-styles.jsVersion}}](https://github.com/vaadin/vaadin-lumo-styles/releases/tag/v{{core.vaadin-lumo-styles.jsVersion}}))
- Vaadin Material theme ([v{{core.vaadin-material-styles.jsVersion}}](https://github.com/vaadin/vaadin-material-styles/releases/tag/v{{core.vaadin-material-styles.jsVersion}})).

### Java Web Framework
- Vaadin Flow ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}}))
- Vaadin Spring Addon ([{{core.flow-spring.javaVersion}}](https://github.com/vaadin/spring/releases/tag/{{core.flow-spring.javaVersion}}))
- Vaadin CDI Addon ([{{core.flow-cdi.javaVersion}}](https://github.com/vaadin/cdi/releases/tag/{{core.flow-cdi.javaVersion}})). You can use the add-on with V10+, see https://github.com/vaadin/cdi#using-with-vaadin-10 for instructions.
- Maven Plugin for Vaadin ({{platform}})
- Gradle plugin for Flow ([{{core.gradle.javaVersion}}](https://github.com/devsoap/gradle-vaadin-flow/releases/tag/{{core.gradle.javaVersion}}))
- Vaadin Multiplatform Runtime **(Prime)**
  - for Framework 7 ([{{core.mpr-v7.javaVersion}}](https://github.com/vaadin/multiplatform-runtime/releases/tag/{{core.mpr-v7.javaVersion}}))
  - for Framework 8 ([{{core.mpr-v8.javaVersion}}](https://github.com/vaadin/multiplatform-runtime/releases/tag/{{core.mpr-v8.javaVersion}}))

### Tools
- Vaadin Designer **(Pro)** ([Release notes](https://github.com/vaadin/designer/blob/master/RELEASE-NOTES.md))
- Vaadin TestBench **(Pro)** ([{{vaadin.vaadin-testbench.javaVersion}}](https://github.com/vaadin/testbench/releases/tag/{{vaadin.vaadin-testbench.javaVersion}}))

# Getting Started with Vaadin 14
## App starters
The best way to get started with Vaadin 14 is to go to [https://vaadin.com/hello-world-starters#v14](https://vaadin.com/hello-world-starters#v14) and pick an app template for the technology stack you’re interested in.

## Maven Archetypes

Maven is the de-facto build tool for Java web applications. Major IDEs also support Maven out of the box and most often you'll be using Maven via your favorite IDE.

There are currently two Maven archetypes available, the `vaadin-archetype-application` which corresponds to the project base for Flow and the corresponding `vaadin-archetype-spring-application` if you prefer use Flow with [Spring](https://spring.io/).

The version of the archetype should match the platform version. After you have Maven installed, you can quickly create and run a Vaadin app with the following command:

```
mvn -B archetype:generate \
                -DarchetypeGroupId=com.vaadin \
                -DarchetypeArtifactId=vaadin-archetype-application \
                -DarchetypeVersion={{platform}}\
                -DgroupId=org.test \
                -DartifactId=vaadin-app \
                -Dversion=1.0-SNAPSHOT \
                && cd vaadin-app \
                && mvn package jetty:run
```

```
mvn -B archetype:generate \
                -DarchetypeGroupId=com.vaadin \
                -DarchetypeArtifactId=vaadin-archetype-spring-application \
                -DarchetypeVersion={{platform}} \
                -DgroupId=org.test \
                -DartifactId=vaadin-app \
                -Dversion=1.0-SNAPSHOT \
                && cd vaadin-app \
                && mvn
```

## Manually changing Vaadin version for Java projects

Add the following dependency to dependencyManagement in pom.xml.
```
<dependency>
    <groupId>com.vaadin</groupId>
    <artifactId>vaadin-bom</artifactId>
    <version>{{platform}}</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```

### Note
If you are using any pre-release version of Flow 2.0 / Vaadin 14 in your project, remove the following files and directories when updating to 14.X:
- webpack-config.js
- package.json
- package-lock.json
- node_modules

# Supported Technologies
## Operating Systems
Development is supported with the following operating systems, for any OS version that supports either frontend development (npm as package manager) or Java 8
- Windows
- Linux
- macOS

## Desktop Browsers
- Evergreen versions of the following browsers :
  - Chrome on the operating systems [supported](https://support.google.com/chrome/a/answer/7100626?hl=en) by the product.
  - Firefox on the [supported](https://www.mozilla.org/en-US/firefox/92.0/system-requirements/) platforms
  - Safari on [macOS](https://support.apple.com/en-us/HT201260) 10.9 or later
  - Edge Chromium on the systems [supported](https://docs.microsoft.com/en-us/deployedge/microsoft-edge-supported-operating-systems) by the vendor.
- Internet Explorer 11 on Windows 7, Windows 8 and Windows 10
  - (see _Known Issues and Limitations_ below)
- Internet Explorer 11 on Windows 7, Windows 8 and Windows 10
  - (see _Known Issues and Limitations_ below)

## Mobile Browsers
The following built-in browsers in the following mobile operating systems:
- Safari starting from iOS 9
- Google Chrome evergreen on Android (requiring Android 4.4 or newer)

## Development environments
Any IDE or editor that works with the language of your choice should work well. Our teams often use Eclipse, IntelliJ, Atom and Visual Studio Code among others (including Emacs and Vim).

**Vaadin Designer** supports the following IDEs:
- Eclipse Java EE versions: Photon, 2018 and 2019.
- JetBrains IntelliJ IDEA 2017, 2018 and 2019. Community or Ultimate edition.

## Java

The server-side parts of Vaadin support version 8, 11 and 17 of any JDK or JREs. More about Java support in [FAQ](https://vaadin.com/faq).

## Application Servers
Vaadin Flow requires Java Servlet API 3.1 (JSR-340) or newer. It is tested on:
- Apache Tomcat 8.0.x, 8.5, 9
- Apache TomEE 7.0.4->
- Oracle WebLogic Server 12.2.1
- IBM WebSphere Application Server 8.5 Liberty Profile and 9
- RedHat JBoss EAP 7
- WildFly 14, 15, 16
- Jetty 9.4
- Payara Server
- Payara Micro

## Supported Node.js and npm versions
Node.js version 10.x for the npm mode.
npm version 5.6.0 or greater.

# Breaking changes
This lists products that have breaking changes from V13

### Flow
- Flow needs you to explicitly enable compatibility mode to keep running as before. [You can read more about compatibility mode in 14 from the documentation.](https://vaadin.com/docs/v14/flow/v14-migration/v14-migration-guide.html#compatibility-mode)

### App Layout 2
- AbstractAppRouterLayout was removed. AppLayout itself now implements RouterLayout.
- AppLayoutMenu and AppLayoutMenuItem were removed.
Migration guide available in [vaadin.com/docs](https://vaadin.com/docs/v14/flow/v14-migration/app-layout-v2-migration-guide.html)

### ComboBox and Datepicker
- The clear button is now hidden by default. To make it visible, use setClearButtonVisible(true). (Note: if the value of the combo box is empty, the clear button is always hidden.)

# Known Issues and Limitations

## OSGi support
- OSGi with npm does not work in V14.0.0-V14.1.0. We are working on a fix for V14.x.

## Performance
- Due to the limitation of web components polyfills, component rendering on IE11 and EdgeHTML can be upto 5-10 times slower than on other browsers

## Flow
- The Template-in-Template feature has [some limitations](https://github.com/vaadin/flow/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+label%3Atemplate-in-template+)
- There are [some issues](https://github.com/vaadin/flow/issues/5146) in using Web Sockets as the Push channel in certain OSGi environments, but long polling works.

## Components
- The dark theme preset does not work in IE11 when applied to the `<html>` element.

# Migrating from Vaadin 8
See [the migration guide](https://vaadin.com/docs/v10/flow/migration/1-migrating-v8-v10.html)

# Migrating from Vaadin 10-13
See [the migration guide](https://vaadin.com/docs/v14/flow/v14-migration/v14-migration-guide.html)

# Reporting Issues
We appreciate if you try to find the most relevant repository to report the issue in. If it is not obvious which project to add issues to, you are always welcome to report any issue at https://github.com/vaadin/platform/issues.

A few rules of thumb will help you and us in finding the correct repository for the issue:
1) Bug tickets and enhancement requests that are specific to a certain Vaadin component should be posted in the component's Web Component repostory (e.g. https://github.com/vaadin/vaadin-button for Button).
2) Issues that are not component-specific (e.g. requests for new components) or encompass multiple components should be posted in [vaadin-flow-components](https://github.com/vaadin/vaadin-flow-components) repository. 
3) If you encounter an issue with Flow which does not seem to be related to a specific component, the problem is likely in Flow itself. The Flow repository is https://github.com/vaadin/flow
4) If you encounter an issue with Designer, the repository is https://github.com/vaadin/designer
5) If you encounter an issue with TestBench, the repository is https://github.com/vaadin/testbench
