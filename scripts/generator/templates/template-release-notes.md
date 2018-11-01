# Vaadin {{platform}}

The Vaadin platform consists of a set of web components, a Java web framework, configurable themes, tools and a set of app templates.

With every major release, we will change and improve things based on your feedback. This may lead into breaking changes, which will be listed for each part of the platform in the breaking changes section.

Visit [vaadin.com](https://vaadin.com/) to get started.

## Platform Support
Vaadin 12 is supported for 4 months after GA (general availability). The latest LTS (long term support) version is Vaadin 10. More details of our release model are available on our [roadmap page](https://vaadin.com/roadmap).

Vaadin also provides [commercial support and warranty](https://vaadin.com/support).

## New and Noteworthy

- Multiplatform runtime for running Framework 7 or 8 applications inside the platform (V10+)
- CDI & OSGi support in Flow
- New Material theme for all components
- New components:
  - vaadin-app-layout
  - vaadin-crud
  - vaadin-time-picker
  - vaadin-checkbox-group
- New server-side API's
  - ContextMenu
  - TreeGrid
- Content renderer functions
- Simple column configuration for vaadin-grid
- ComboBox lazy-loading

{{changesSincePrevious}}
## Included Projects and Change Log
The Vaadin platform includes the following projects. Release notes with detailed change logs for each project are linked below.

Projects marked as **(Pro)** are available for users with [Pro](https://vaadin.com/pricing) or [Prime](https://vaadin.com/pricing) subscriptions. Everything else is free and open source.

Projects marked as **(Community)** are created by the Vaadin open source community, and are tested to be compatible with the platform. Support for these projects is not included in Vaadin Warranty.

### Components
{{components}}

### Themes
- Vaadin Lumo theme ([v{{core.vaadin-lumo-styles.jsVersion}}](https://github.com/vaadin/vaadin-lumo-styles/releases/tag/v{{core.vaadin-lumo-styles.jsVersion}}))
- Vaadin Material theme ([v{{core.vaadin-material-styles.jsVersion}}](https://github.com/vaadin/vaadin-material-styles/releases/tag/v{{core.vaadin-material-styles.jsVersion}})).

### Java Web Framework
- Vaadin Flow ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}}))
- Vaadin Spring Addon ([{{core.flow-spring.javaVersion}}](https://github.com/vaadin/spring/releases/tag/{{core.flow-spring.javaVersion}}))
- Vaadin CDI Addon ([{{core.flow-cdi.javaVersion}}](https://github.com/vaadin/cdi/releases/tag/{{core.flow-cdi.javaVersion}})). You can use the add-on with V10+, see https://github.com/vaadin/cdi#using-with-vaadin-10 for instructions.
- Maven Plugin for Vaadin ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}}))
- Gradle plugin for Flow **(Community)** ([{{community.gradle.javaVersion}}](https://github.com/devsoap/gradle-vaadin-flow/releases/tag/{{community.gradle.javaVersion}}))
- Vaadin Multiplatform Runtime **(Prime)**
  - for Framework 7 ([{{core.mpr-v7.javaVersion}}](https://github.com/vaadin/multiplatform-runtime/releases/tag/{{core.mpr-v7.javaVersion}}))
  - for Framework 8 ([{{core.mpr-v8.javaVersion}}](https://github.com/vaadin/multiplatform-runtime/releases/tag/{{core.mpr-v8.javaVersion}}))
  - Both versions work with previous platform versions.

### Tools
- Vaadin Designer **(Pro)** ([Release notes](https://github.com/vaadin/designer/blob/master/RELEASE-NOTES.md))
- Vaadin TestBench **(Pro)** ([{{vaadin.vaadin-testbench.javaVersion}}](https://github.com/vaadin/testbench/releases/tag/{{vaadin.vaadin-testbench.javaVersion}}))

### App Starters
All app starters are available at https://vaadin.com/start

# Getting Started with Vaadin 12
The best way to get started with Vaadin 12 is to go to https://vaadin.com/start and pick an app template for the technology stack you’re interested in. There are two types of app templates available.

The **Project Bases** are for starting your project from scratch with only the necessary dependencies and a couple of placeholder files available.

There are also full application examples available like **Bakery (Pro)** and **Beverage Buddy**. Those show you some opinionated examples on how to build different types of applications, with optionally integrating to a backend.

### Getting Started Manually

For **frontend projects** you can get the dependencies with 
 - [Bower](https://bower.io) by running `bower install vaadin` or `bower install vaadin-core`
 - [NPM](https://www.npmjs.com) by running `npm install @vaadin/vaadin` or `npm install @vaadin/vaadin-core`

For **Java projects**, an example of the necessary setup can be found from the [Project Base](https://github.com/vaadin/skeleton-starter-flow/blob/1.0.0/pom.xml#L24..L73).

# Supported Technologies
## Operating Systems
Development is supported with the following operating systems, for any OS version that supports either frontend development (Bower as package manager) or Java 8
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
  - Safari on macOS 10.9 (OS X Mavericks) or later
  - Edge on Windows 10 or later
- Internet Explorer 11 on Windows 7, Windows 8 and Windows 10
  - (preliminary support, see _Known Issues and Limitations_ below)
  - supported only in _production mode_. See [documentation](https://github.com/vaadin/flow-and-components-documentation/blob/master/documentation/production/tutorial-production-mode-basic.asciidoc) for more information.

## Mobile Browsers
The following built-in browsers in the following mobile operating systems:
- Safari starting from iOS 9
- Google Chrome evergreen on Android (requiring Android 4.4 or newer)

## Development environments

Any IDE or editor that works with the language of your choice should work well. Our teams often use Eclipse, IntelliJ, Atom, VS.code among others (including Emacs and Vim).

**Vaadin Designer** supports the following IDEs:
- Eclipse Java EE versions: Oxygen, Photon and 2018.
- JetBrains IntelliJ IDEA 2016, 2017 and 2018. Community or Ultimate edition.

## Java Related Technologies and Tooling Support
The included Java parts are compatible with Java 8 and newer.

## Application Servers
Vaadin Flow requires Java Servlet API 3.1 (JSR-340) or newer. It is tested on:
- Apache Tomcat 8.0.x, 8.5, 9
- Oracle WebLogic Server 12.2.1
- IBM WebSphere Application Server 8.5 Liberty Profile and 9
- RedHat JBoss EAP 7
- WildFly 8, 9, 10, 11, 12
- Jetty 9
- Payara Server
- Payara Micro

# Breaking changes
This lists products that have breaking changes from V11
- vaadin-combo-box Java API ([release notes](https://github.com/vaadin/vaadin-combo-box-flow/releases/tag/{{core.vaadin-combo-box.javaVersion}}))

# Known Issues and Limitations

## Flow
- The Template-in-Template feature has [some limitations](https://github.com/vaadin/flow/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+label%3Atemplate-in-template+)
- There is no OSGi support. Add a :+1: to https://github.com/vaadin/flow/issues/455 to indicate your interest

## Designer
- External preview doesn't work on IE11.
- Horizontal scrolling using the trackpad doesn't work Eclipse.

# Migrating from Vaadin 8
See [the migration guide](https://vaadin.com/docs/v10/flow/migration/1-migrating-v8-v10.html)

# Reporting Issues
We appreciate if you try to find the most relevant repository to report the issue in. If it is not obvious which project to add issues to, you are always welcome to report any issue at https://github.com/vaadin/platform/issues.

A few rules of thumb will help you and us in finding the correct repository for the issue:
1) If you encounter an issue when using the HTML/JS API of a component or the component renders incorrectly, the problem is likely in the web component. The web component repositories are named like https://github.com/vaadin/vaadin-button
2) If you encounter an issue when using the Java API of a component, the problem is likely in the Flow integration of the web component. The Flow component integration repositories are named like https://github.com/vaadin/vaadin-button-flow
3) If you encounter an issue with Flow which does not seem to be related to a specific component, the problem is likely in Flow itself. The Flow repository is https://github.com/vaadin/flow
4) If you encounter an issue with Designer, the repository is https://github.com/vaadin/designer
5) If you encounter an issue with TestBench, the repository is https://github.com/vaadin/testbench
6) If you encounter issues with code or the UI in any of the app starters, the corresponding repositories are:
  a) https://github.com/vaadin/bakery-app-starter-issues for Bakery
  b) https://github.com/vaadin/beverage-starter-flow for Beverage Buddy
  c) https://github.com/vaadin/skeleton-starter-flow for Flow project base
  d) https://github.com/vaadin/skeleton-starter-flow for Flow and Spring Boot project base
  e) https://github.com/vaadin/generator-polymer-init-vaadin-elements-app for Polymer project base
  f) https://github.com/vaadin/base-starter-angular for Angular project base
  g) https://github.com/vaadin/base-starter-react for React project base
  h) https://github.com/vaadin/base-starter-vue for Vue project base

