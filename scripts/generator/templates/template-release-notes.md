# Vaadin {{platform}}

Vaadin consists of a set of web components, a Java web framework, configurable themes, tools and a set of app templates.

Visit [vaadin.com](https://vaadin.com/) to get started.

## New and Noteworthy Since Vaadin 20

Here are the highlighted new and improved features in vaadin 20. To see the full list of bug fixes and improvements, check Included Projects and Change Log.


{{changesSincePrevious}}

## Support
Vaadin 21 is supported for one month after Vaadin 22 has been released. The latest LTS (long term support) version is Vaadin 14. More details of our release model are available on our [roadmap page](https://vaadin.com/roadmap).

Vaadin also provides [commercial support and warranty](https://vaadin.com/support).

## Included Projects and Change Log
Vaadin includes the following projects. Release notes with detailed change logs for each project are linked below.

Projects marked as **(Pro)** are available for users with [Pro](https://vaadin.com/pricing) or [Prime](https://vaadin.com/pricing) subscriptions. Everything else is free and open source.

### Java Web Framework
- Vaadin Flow ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}}))
- Vaadin Spring Addon ([{{core.flow-spring.javaVersion}}](https://github.com/vaadin/spring/releases/tag/{{core.flow-spring.javaVersion}}))
- Vaadin CDI Addon ([{{core.flow-cdi.javaVersion}}](https://github.com/vaadin/cdi/releases/tag/{{core.flow-cdi.javaVersion}})). You can use the add-on with V10+, see https://github.com/vaadin/cdi#using-with-vaadin-10 for instructions.
- Maven Plugin for Vaadin ({{platform}})
- Gradle plugin for Flow ([{{core.gradle.javaVersion}}](https://github.com/devsoap/gradle-vaadin-flow/releases/tag/{{core.gradle.javaVersion}}))
- Vaadin Multiplatform Runtime **(Prime)**
  - for Framework 7 ([{{core.mpr-v7.javaVersion}}](https://github.com/vaadin/multiplatform-runtime/releases/tag/{{core.mpr-v7.javaVersion}}))
  - for Framework 8 ([{{core.mpr-v8.javaVersion}}](https://github.com/vaadin/multiplatform-runtime/releases/tag/{{core.mpr-v8.javaVersion}}))
  
### Components
#### Vaadin Web Components
All listed Vaadin web components' version are using [{{core.vaadin-accordion.jsVersion}}](https://github.com/vaadin/web-components/releases/tag/v{{core.vaadin-accordion.jsVersion}})

#### Vaadin flow components
All listed Vaadin components' Java integration follows the Vaadin version [{{platform}}](https://github.com/vaadin/flow-components/releases/tag/{{platform}})

{{components}}

### Themes
All listed Vaadin themes' version are sharing [{{core.vaadin-lumo-styles.jsVersion}}](https://github.com/vaadin/web-components/releases/tag/v{{core.vaadin-lumo-styles.jsVersion}})
- Vaadin Lumo theme
- Vaadin Material theme

### Router
- Vaadin Router ([v{{core.vaadin-router.jsVersion}}](https://github.com/vaadin/vaadin-router/releases/tag/v{{core.vaadin-router.jsVersion}}))

### Collaboration Engine
- Vaadin Collaboration Engine ([{{vaadin.vaadin-collaboration-engine.javaVersion}}](https://github.com/vaadin/collaboration-engine/releases/tag/{{vaadin.vaadin-collaboration-engine.javaVersion}})) 

### Tools
- Vaadin Designer **(Pro)** ([Release notes](https://github.com/vaadin/designer/blob/master/RELEASE-NOTES.md))
- Vaadin TestBench **(Pro)** ([{{vaadin.vaadin-testbench.javaVersion}}](https://github.com/vaadin/testbench/releases/tag/{{vaadin.vaadin-testbench.javaVersion}}))

# Getting Started with Vaadin
## App starters
The best way to get started with Vaadin is to go to [https://start.vaadin.com](https://start.vaadin.com) and configure your new application by setting up your views, entities, styles, and the technology stack you’re interested in. 

### Note
Vaadin 21 starters are not available just yet in vaadin.com. You can use Vaadin 20 starter and manually change Vaadin version (see instructions below).

## Maven Archetypes

Maven is the de-facto build tool for Java web applications. Major IDEs also support Maven out of the box and most often you'll be using Maven via your favorite IDE. There is currently one Maven archetype available, the `vaadin-archetype-application` which corresponds to the project base for Flow. The version of the archetype should match the platform version. After you have Maven installed, you can quickly create and run a Vaadin app with the following command:

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

Read more about upgrading to Vaadin 20 from [vaadin.com](https://vaadin.com/docs/v16/flow/typescript/upgrading-from-vaadin14.html#step-1b).


# Supported Technologies
## Operating Systems
Development is supported with the following operating systems:
- Windows
- Linux
- macOS

## Desktop Browsers
- Evergreen versions of the following browsers on :
  - Chrome on these operating systems:
    - Windows 7, Windows 8.1, Windows 10 or later
    - macOS 10.9 (OS X Mavericks) or later
    - 64-bit Ubuntu 14.04+, Debian 8+, openSUSE 13.3+, or Fedora Linux 24+
  - Firefox on these operating systems
    - Windows 7, Windows 8.1, Windows 10 or later
    - macOS 10.9  (OS X Mavericks) or later
    - Any Linux with the following packages:
      - GTK+ 3.4 or higher
      - GLib 2.22 or higher
      - Pango 1.14 or higher
      - X.Org 1.0 or higher (1.7 or higher is recommended)
      - libstdc++ 4.6.1 or higher
    - Latest Firefox ESR is supported (starting from Firefox ESR 68)
  - Safari on macOS 10.15 or later (starting from Safari 13, available also for macOS 10.14.5 and 10.13.6)
  - Edge on Windows 10 or later. Note: Vaadin 15 supports only Edge Chromium and does not provide support for EdgeHTML. 

## Mobile Browsers
The following built-in browsers in the following mobile operating systems:
- Safari starting from iOS 13
- Google Chrome evergreen on Android (requiring Android 4.4 or newer)

## Development environments
Any IDE or editor that works with the language of your choice should work well. Our teams often use Eclipse, IntelliJ, Atom and Visual Studio Code among others (including Emacs and Vim).

**Vaadin Designer** supports the following IDEs:
- Eclipse Java EE versions: Photon, 2018 and 2019.
- JetBrains IntelliJ IDEA 2017, 2018 and 2019. Community or Ultimate edition.

## Java

Vaadin supports version 8 and 11 of any JDK or JREs. More about Java support in [FAQ](https://vaadin.com/faq).

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
- Karaf (4.2+)

## Supported Node.js and npm versions
A [supported version](https://nodejs.org/en/about/releases/) of Node.js: 10.x, 12.x, 14.x or newer.

# Breaking changes
This lists products that have breaking changes from V14

# Known Issues and Limitations

## Flow
- The Template-in-Template feature has [some limitations](https://github.com/vaadin/flow/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+label%3Atemplate-in-template+)
- Links matching the context do not result in browser page load by default, instead they are handled with application routing. To opt-out, set the `router-ignore` attribute on the anchor element. This opt-out is needed for cases when native browser navigation is necessary, e. g., when [using `Anchor` to link a `StreamResource` download](https://github.com/vaadin/flow/issues/7623).

## OSGi support
OSGi does not work in V15.

# Migrating from Vaadin 8
See [the migration guide]( https://vaadin.com/docs-beta/v14/guide/upgrading/v8/)

# Migrating from Vaadin 10-14
See [the migration guide]( https://vaadin.com/docs-beta/v14/guide/upgrading/v10-13/)

# Migrating from Vaadin 15
See [the migration guide](https://vaadin.com/docs-beta/latest/guide/upgrading)

# Reporting Issues
We appreciate if you try to find the most relevant repository to report the issue in. If it is not obvious which project to add issues to, you are always welcome to report any issue at https://github.com/vaadin/platform/issues.

A few rules of thumb will help you and us in finding the correct repository for the issue:
1) Bug tickets and enhancement requests that are specific to a certain Vaadin component should be posted in the component's Web Component repostory (e.g. https://github.com/vaadin/vaadin-button for Button).
2) Issues that are not component-specific (e.g. requests for new components) or encompass multiple components should be posted in [flow-components](https://github.com/vaadin/flow-components) repository. 
3) If you encounter an issue with Flow which does not seem to be related to a specific component, the problem is likely in Flow itself. The Flow repository is https://github.com/vaadin/flow
4) If you encounter an issue with Designer, the repository is https://github.com/vaadin/designer
5) If you encounter an issue with TestBench, the repository is https://github.com/vaadin/testbench
