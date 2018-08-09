# Vaadin {{platform}}

The Vaadin platform consists of a set of web components, a Java web framework, configurable themes, tools and a set of app templates.

Visit [vaadin.com](https://vaadin.com/) to get started.

## Changes since previous version

Include latest versions of all components, tools, Java web framework and app starters.

## Support
Vaadin 10 is an LTS (long term support) version, which will be supported at least for 5 years after the GA (general availability) release. [Learn more about the support](https://vaadin.com/support).

## New and Noteworthy

Please [see the release blog post in vaadin.com](https://vaadin.com/blog/vaadin-10-is-out-)

## Included Projects and Change Log
The Vaadin platform includes the following projects. Release notes with detailed change logs for each project are linked below.

Projects marked as **(PRO)** are available for users with [Pro](https://vaadin.com/pricing) or [Prime](https://vaadin.com/pricing) subscriptions. Everything else is free and open source.

### Components
{{components}}

### Themes
- Vaadin Lumo theme ([v{{core.vaadin-lumo-styles.jsVersion}}](https://github.com/vaadin/vaadin-lumo-styles/releases/tag/v{{core.vaadin-lumo-styles.jsVersion}})).

### Java Web Framework
- Vaadin Flow ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}}))
- Maven Plugin for Flow ([{{core.flow.javaVersion}}](https://github.com/vaadin/flow/releases/tag/{{core.flow.javaVersion}}))
- Maven Plugin for Vaadin {{core.flow.javaVersion}}
- Vaadin Spring Addon [{{core.flow-spring.javaVersion}}](https://github.com/vaadin/spring/releases/tag/{{core.flow-spring.javaVersion}})

### Tools
- Vaadin Designer **(PRO)** ([{{vaadin.vaadin-designer.javaVersion}}](https://github.com/vaadin/designer/blob/{{vaadin.vaadin-designer.javaVersion}}/RELEASE-NOTES.md))
- Vaadin TestBench **(PRO)** ([{{vaadin.vaadin-testbench.javaVersion}}](https://github.com/vaadin/testbench/releases/tag/{{vaadin.vaadin-testbench.javaVersion}}))

### App Starters
All app starters are available at https://vaadin.com/start

- Bakery App Starter for Flow and Spring  **(PRO)** (sources available via [vaadin.com/start](https://vaadin.com/start))
- Beverage Buddy App Starter for Flow ([github repository](https://github.com/vaadin/beverage-starter-flow))
- Project Base for Flow ([github repository](https://github.com/vaadin/skeleton-starter-flow))
- Project Base for Flow and Spring ([github repository](https://github.com/vaadin/skeleton-starter-flow-spring))
- Project Base for Polymer with Vaadin Components ([github repository](https://github.com/vaadin/generator-polymer-init-vaadin-elements-app))
- Project Base for Angular with Vaadin Components ([github repository](https://github.com/vaadin/base-starter-angular))
- Project Base for React with Vaadin Components ([github repository](https://github.com/vaadin/base-starter-react))
- Project Base for Vue with Vaadin Components ([github repository](https://github.com/vaadin/base-starter-vue))
- Starter project for creating Vaadin 10 Java add-ons (sources available via [vaadin.com/start](https://vaadin.com/start))

# Getting Started with Vaadin 10
The best way to get started with Vaadin 10 is to go to https://vaadin.com/start and pick an app template for the technology stack you’re interested in. There are two types of app templates available.

The **Project Bases** are for starting your project from scratch with only the necessary dependencies and a couple of placeholder files available.

There are also full application examples available like **Bakery (Pro)** and **Beverage Buddy**. Those show you some opinionated examples on how to build different types of applications, with optionally integrating to a backend.

### Getting Started Manually

For **frontend projects** you can get the dependencies with [Bower](https://bower.io) by running `bower install vaadin` or `bower install vaadin-core`.

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
- Eclipse Java EE versions: Mars, Neon and Oxygen
- JetBrains IntelliJ IDEA 2016, 2017 and 2018. Community or Ultimate edition.

## Java Related Technologies and Tooling Support
The included Java parts are compatible with Java 8 and newer.

## Application Servers
Vaadin Flow requires Java Servlet API 3.1 (JSR-340) or newer. It is tested on:
- Apache Tomcat 8.0.x, 8.5, 9
- Oracle WebLogic Server 12.2.1
- IBM WebSphere Application Server 8.5 Liberty and 9
- RedHat JBoss EAP 7
- WildFly 8, 9, 10, 11, 12
- Jetty 9
- Payara Server
- Payara Micro

# Known Issues and Limitations

## Flow
- The Template-in-Template feature has [some limitations](https://github.com/vaadin/flow/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+label%3Atemplate-in-template+) 
- There is no CDI support, the official V10 compatible add-on will be released during summer 2018, see https://github.com/vaadin/cdi/tree/master for updates
- There is no OSGi support, go add a :+1: to https://github.com/vaadin/flow/issues/455 to indicate your interest in this

## Designer
- External preview doesn't work on IE11.
- Horizontal scrolling using the trackpad doesn't work on macOS Eclipse.

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

