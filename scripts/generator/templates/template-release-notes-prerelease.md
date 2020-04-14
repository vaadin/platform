# Vaadin {{platform}}

Vaadin consists of a set of web components, a Java web framework, configurable themes, tools and a set of app templates.

With every major release, we will change and improve things based on your feedback. This may lead to breaking changes, which will be listed for each part of the platform in the breaking changes section.

Visit [vaadin.com](https://vaadin.com/) to get started.

## Support
Vaadin 14 is an LTS (long term support) version, which will be supported for 5 years after the GA (general availability) release. More details of our release model are available on our [roadmap page](https://vaadin.com/roadmap).

Vaadin also provides [commercial support and warranty](https://vaadin.com/support).

## New and Noteworthy Since 14.1

### Automatic Node and npm installation
- If no global or local Node installation is found Node will be automatically installed to ~/.vaadin
  - Only requires the first project to install as later can use the same installation
  - No need to have Node installed for CI
- Uses proxy data from 
  - System properties
  - {project}/.npmrc
  - ~/.npmrc
  - Environment variables

### Better frontend dependency management by using _pnpm_ AKA _performant npm_
- Packages are by default cached locally and linked instead of downloaded for every project
-> Faster recurring builds in comparison to _npm_ ([benchmarks](https://www.npmjs.com/package/pnpm#benchmark))
- Only one `package.json` file used, reducing complexity (previously another file was in `/target`)
-> More reliable build when updating Vaadin version
-> This change applies also for npm since 14.0 or 14.1
- **No migration needed**, see [differences here](https://github.com/vaadin/flow-and-components-documentation/blob/V14-next/documentation/advanced/tutorial-switch-npm-pnpm.asciidoc) for more information about what has changed
- For running pnpm on a CI server, please see details [here](https://pnpm.js.org/en/continuous-integration)

**NOTE: npm is still used by default, so you need to explicitly enable pnpm**
See instructions from [vaadin.com/docs/](https://vaadin.com/docs/v15/flow/advanced/tutorial-switch-npm-pnpm.html).

### Fire routing life-cycle `BeforeEnterEvent` from parent -> child order
This change affects the ordering of routing events and the timeline when routing components are created.
After this change, routing events are fired in the following order:
1) Global routing handlers are invoked
2) `setParameter` is invoked for the topmost navigation layer (main layout)
3) `BeforeEnterHandler` handler is invoked for the topmost navigation layer (main layout) if implemented
4) Next level component instances are created, and steps 2-3 triggered for that layer

Before this change, all routing components were created eagerly, and events were fired from child->parent order with first `setParameter` invoked, then global handlers and last `BeforeEnterHandler`s.
**This change fixes a design flaw and prevents developers from accidentally compromising application security when routing components are not created if the end-user does not have access to them**. 
**In case this change would break your existing Vaadin 10+ project, please [open an issue](https://github.com/vaadin/flow/issues).**

### Portlet 3.0 support for Pluto portal
- Enabled by using an [add-on](https://github.com/vaadin/portlet)
- [Documentation](https://github.com/vaadin/flow-and-components-documentation/blob/V14-next/documentation/portlet-support/portlet-01-overview.asciidoc) and [demo](https://github.com/vaadin/addressbook-portlet)

### Components
- New component: `Vaadin DateTimePicker`
- Draggable, Resizable and Modal configuration for `Dialog`
- `vaadin-ordered-layout`: add support for flexLayout feature and `Scroller` for scrolling overflowing content
- `vaadin-time-picker`: New max and min time API

Previous features in Vaadin 14 can be found from [14.1 release note](https://github.com/vaadin/platform/releases/tag/14.1.0)

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
The best way to get started with Vaadin 14 is to go to [https://vaadin.com/start](https://vaadin.com/start) and pick an app template for the technology stack you’re interested in. 

## Manually changing Vaadin version for Java projects

Add the following contents to your project pom.xml.
```
<dependencyManagement>
    ...
    <dependency>
        <groupId>com.vaadin</groupId>
        <artifactId>vaadin-bom</artifactId>
        <version>{{platform}}</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
    ...
</dependencyManagement>
<repositories>
    <repository>
        <id>vaadin-prerelease</id>
        <url>https://maven.vaadin.com/vaadin-prereleases</url>
    </repository>
</repositories>
<pluginRepositories>
    <pluginRepository>
        <id>vaadin-prerelease</id>
        <url>https://maven.vaadin.com/vaadin-prereleases</url>
    </pluginRepository>
</pluginRepositories>
```

# Known Issues and Limitations

This is the prerelease version of Vaadin 14.x for evaluating a number of new features and bug fixes. The API in this prerelease version is not considered final and may change based on user feedback.

### NOTE: Manual deletion is needed when downgrade version to 14.1
- please remove the following files/fold when downgrade your vaadin version from 14.2 to 14.1: `node_modules`, `target`, `package.json`, `pnpm-lock.yaml`, `pnpmfile.js`

## OSGi support
- OSGi with npm does not work in V14.0.0-V14.2.0. We are working on a fix for V14.x.
- OSGi with Bower has problems with V14.0.0-V14.2.0

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
1) If you encounter an issue when using the HTML/JS API of a component or the component renders incorrectly, the problem is likely in the web component. The web component repositories are named like https://github.com/vaadin/vaadin-button
2) If you encounter an issue when using the Java API of a component, the problem is likely in the Flow integration of the web component. The Flow component integration repositories are named like https://github.com/vaadin/vaadin-button-flow
3) If you encounter an issue with Flow which does not seem to be related to a specific component, the problem is likely in Flow itself. The Flow repository is https://github.com/vaadin/flow
4) If you encounter an issue with Designer, the repository is https://github.com/vaadin/designer
5) If you encounter an issue with TestBench, the repository is https://github.com/vaadin/testbench
