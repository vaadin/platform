# Vaadin {{platform}}

Vaadin consists of a set of web components, a Java web framework, configurable themes, tools and a set of app templates.

Visit [vaadin.com](https://vaadin.com/) to get started.

## New and Noteworthy Since Vaadin 17

Here are the highlighted new and improved features in Vaadin 18. To see the full list of bug fixes and improvements, check Included Projects and Change Log.

### Framework
#### Features
- LitElement support
  - There is a new default template format people should use instead of Polymer when using Java UI logic. Featureset is bit more limited than before, and the template format users shouldn’t mix client and server side logic (but to choose either TS development model or pure server side UI logic).
- Improved lazy data binding for ComboBox
  - No count query needed anymore, API simplified similarly as for Grid in V17
  
### Components
- Field helpers
  - Slot below/above input fields for supplying additional information or content related to the field. 
- AutoOpenDisabled
  - mode for ComboBox, DatePicker, TimePicker, DateTimePicker that prevents dropdown from opening automatically on focus
- new component: vaadin-avatar 
  - Avatar and AvatarGroup components. Being able to show users with name, abbreviations and image. AvatarGroup is a collection of Avatars with the possibility to truncate it to a certain number of visible avatars.
- Flow components versioning has changed, now all components are released at once with Vaadin Platform sharing the same version.

{{changesSincePrevious}}

## Support
Vaadin 18 is supported for one month after Vaadin 19 has been released. The latest LTS (long term support) version is Vaadin 14. More details of our release model are available on our [roadmap page](https://vaadin.com/roadmap).

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
{{components}}

### Themes
- Vaadin Lumo theme ([v{{core.vaadin-lumo-styles.jsVersion}}](https://github.com/vaadin/vaadin-lumo-styles/releases/tag/v{{core.vaadin-lumo-styles.jsVersion}}))
- Vaadin Material theme ([v{{core.vaadin-material-styles.jsVersion}}](https://github.com/vaadin/vaadin-material-styles/releases/tag/v{{core.vaadin-material-styles.jsVersion}})).

### Router
- Vaadin Router ([v{{core.vaadin-router.jsVersion}}](https://github.com/vaadin/vaadin-router/releases/tag/v{{core.vaadin-router.jsVersion}}))

### Tools
- Vaadin Designer **(Pro)** ([Release notes](https://github.com/vaadin/designer/blob/master/RELEASE-NOTES.md))
- Vaadin TestBench **(Pro)** ([{{vaadin.vaadin-testbench.javaVersion}}](https://github.com/vaadin/testbench/releases/tag/{{vaadin.vaadin-testbench.javaVersion}}))

# Getting Started with Vaadin
## App starters
The best way to get started with Vaadin is to go to [https://vaadin.com/start](https://vaadin.com/start) and pick an app template for the technology stack you’re interested in. 

### Note
Vaadin 18 starters are not available just yet in vaadin.com. You can use Vaadin 14 starter and manually change Vaadin version (see instructions below).

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
        <id>vaadin-prereleases</id>
        <url>https://maven.vaadin.com/vaadin-prereleases</url>
    </repository>
</repositories>

<pluginRepositories>
    <pluginRepository>
        <id>vaadin-prereleases</id>
        <url>https://maven.vaadin.com/vaadin-prereleases</url>
    </pluginRepository>
</pluginRepositories>
```

# Known Issues and Limitations

This is the prerelease version of Vaadin 18 for evaluating a number of new features and bug fixes. The API in this prerelease version is not considered final and may change based on user feedback.

## Flow
- The Template-in-Template feature has [some limitations](https://github.com/vaadin/flow/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+label%3Atemplate-in-template+)
- Links matching the context do not result in browser page load by default, instead they are handled with application routing. To opt-out, set the `router-ignore` attribute on the anchor element. This opt-out is needed for cases when native browser navigation is necessary, e. g., when [using `Anchor` to link a `StreamResource` download](https://github.com/vaadin/flow/issues/7623).

# Migrating from Vaadin 8
See [the migration guide](https://vaadin.com/docs/v10/flow/migration/1-migrating-v8-v10.html)

# Migrating from Vaadin 10-14
See [the migration guide](https://vaadin.com/docs/v14/flow/v14-migration/v14-migration-guide.html)

# Reporting Issues
We appreciate if you try to find the most relevant repository to report the issue in. If it is not obvious which project to add issues to, you are always welcome to report any issue at https://github.com/vaadin/platform/issues.

A few rules of thumb will help you and us in finding the correct repository for the issue:
1) If you encounter an issue when using the HTML/JS API of a component or the component renders incorrectly, the problem is likely in the web component. The web component repositories are named like https://github.com/vaadin/vaadin-button
2) If you encounter an issue when using the Java API of a component, the problem is likely in the Flow integration of the web component. The Flow component integration repositories are named like https://github.com/vaadin/vaadin-button-flow
3) If you encounter an issue with Flow which does not seem to be related to a specific component, the problem is likely in Flow itself. The Flow repository is https://github.com/vaadin/flow
4) If you encounter an issue with Designer, the repository is https://github.com/vaadin/designer
5) If you encounter an issue with TestBench, the repository is https://github.com/vaadin/testbench
