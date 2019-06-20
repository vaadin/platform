# Vaadin {{platform}}

The Vaadin platform consists of a set of web components, a Java web framework, configurable themes, tools and a set of app templates.

With every major release, we will change and improve things based on your feedback. This may lead to breaking changes, which will be listed for each part of the platform in the breaking changes section.

Visit [vaadin.com](https://vaadin.com/) to get started.

## Platform Support
Vaadin 14 is an LTS (long term support) version, which will be supported at least for 5 years after the GA (general availability) release. More details of our release model are available on our [roadmap page](https://vaadin.com/roadmap).

Vaadin also provides [commercial support and warranty](https://vaadin.com/support).

## New and Noteworthy

Here are the highlighted new and improved features in Vaadin 14. To see the full list of bug fixes and improvements, check Included Projects and Change Log.

### Framework
- The possibility to use Polymer 3, npm and JavaScript Modules instead of Polymer 2, Bower and HTML Imports.
- Adding @PreserveOnRefresh on a router layout or route will preserve the user edited component state when the user refreshes the page by reusing the component instances
- Embedding Flow application is now possible by exporting it as a web component.
- When executing JavaScript from the server side Java, it is possible to get the return value of the execution to the server side using Page.executeJs(String expression, Serializable... parameters)
- It is possible to obtain details like screen width & height and time zone on the server side using Page.retrieveExtendedClientDetails( ExtendedClientDetailsReceiver receiver)

### Components
- Grid rows drag and drop
- Grid columns auto-width
- Customise value representation for Grid Pro
- Menubar component added
- App Layout with drawer
- Clear button visibility APIs
- Dropdown select value change without opening
- New theme variants for Notification

{{changesSincePrevious}}
## Included Projects and Change Log
The Vaadin platform includes the following projects. Release notes with detailed change logs for each project are linked below.

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
  - Both versions work with previous platform versions.

### Tools
- Vaadin Designer **(Pro)** ([Release notes](https://github.com/vaadin/designer/blob/master/RELEASE-NOTES.md))
- Vaadin TestBench **(Pro)** ([{{vaadin.vaadin-testbench.javaVersion}}](https://github.com/vaadin/testbench/releases/tag/{{vaadin.vaadin-testbench.javaVersion}}))

### App Starters
All app starters are available at https://vaadin.com/start

# Getting Started with Vaadin 14
## App starters
The best way to get started with Vaadin 14 is to go to https://vaadin.com/start and pick an app template for the technology stack you’re interested in. There are two types of app templates available.

The **Project Bases** are for starting your project from scratch with only the necessary dependencies and a couple of placeholder files available.

There are also full application examples available like **Bakery (Pro)** and **Beverage Buddy**. Those show you opinionated examples on how to build different types of applications, with optionally integrating to a backend.

## Maven Archetypes

Maven is the de-facto build tool for Java web applications. Major IDEs also support Maven out of the box and most often you'll be using Maven via your favorite IDE. There is currently one Maven archetype available, the `vaadin-archetype-application` which corresponds to the project base for Flow. The version of the archetype should match the platform version. After you have Maven installed, you can quickly create and run a Vaadin app with the following command:

```
mvn -B archetype:generate \
                -DarchetypeGroupId=com.vaadin \
                -DarchetypeArtifactId=vaadin-archetype-application \
                -DarchetypeVersion={{platform}}\
                -DgroupId=org.test \
                -DartifactId=vaadin-app \
                -Dversion=1.0-SNAPSHOT
                && cd vaadin-app
                && mvn package jetty:run
```

## Getting Started Manually

For **frontend projects** you can get the dependencies with [Bower](https://bower.io) or [NPM](https://www.npmjs.com).
 - Bower by running `bower install vaadin#{{platform}}` or `bower install vaadin-core#{{platform}}`
 - NPM by running `npm install @vaadin/vaadin@{{platform}}` or `npm install @vaadin/vaadin-core@{{platform}}`
 - There are also version-locked (with [shrinkwrap](https://docs.npmjs.com/cli/shrinkwrap.html)) NPM dependencies available from `@vaadin/vaadin-shrinkwrap#{{platform}}` and `@vaadin/vaadin-core-shrinkwrap#{{platform}}`.

For **Java projects**, an example of the necessary setup can be found from the [Project Base](https://github.com/vaadin/skeleton-starter-flow/blob/1.0.0/pom.xml#L24..L73).

### Manually changing Vaadin version for Java projects

Add the following dependency to dependencyManagement in pom.xml.
```
<dependency>
    <groupId>com.vaadin</groupId>
    <artifactId>vaadin-bom</artifactId>
    <version>{{platform}}</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>

### Note
if you are using any pre-release version of Flow 2.0 / Vaadin 14 in your project, remove the following file when updating to 2.0.0 / 14.0.0.rc1:
- webpack-config.js

Optionally, if you still have issues, try removing:
- package.json & package-lock.json & node_modules```

# Supported Technologies
## Operating Systems
Development is supported with the following operating systems, for any OS version that supports either frontend development (Bower/NPM as package manager) or Java 8
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
Any IDE or editor that works with the language of your choice should work well. Our teams often use Eclipse, IntelliJ, Atom and Visual Studio Code among others (including Emacs and Vim).

**Vaadin Designer** supports the following IDEs:
- Eclipse Java EE versions: Photon, 2018 and 2019.
- JetBrains IntelliJ IDEA 2017, 2018 and 2019. Community or Ultimate edition.

## Java Related Technologies and Tooling Support
The included Java parts are compatible with Java 8 and newer.

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


# Known Issues and Limitations

## Flow
- The Template-in-Template feature has [some limitations](https://github.com/vaadin/flow/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+label%3Atemplate-in-template+)
- There are [some issues](https://github.com/vaadin/flow/issues/5146) in using Web Sockets as the Push channel in certain OSGi environments, but long polling works.

## Components
- The dark theme preset does not work in IE11 when applied to the `<html>` element.

## Designer
- External preview doesn't work in IE11.
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
