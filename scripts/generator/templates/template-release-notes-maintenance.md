# Vaadin {{platform}}

Vaadin consists of a set of web components, a Java web framework, configurable themes, tools and a set of app templates.

This is a maintenance release of Vaadin.
For the full release notes go to the [GitHub releases](https://github.com/vaadin/platform/releases/tag/14.0.0).

Visit [vaadin.com](https://vaadin.com/) to get started.

## Support
Vaadin 14 is an LTS (long term support) version, which will be supported for 5 years after the GA (general availability) release. More details of our release model are available on our [roadmap page](https://vaadin.com/roadmap).

Vaadin also provides [commercial support and warranty](https://vaadin.com/support).

## New and Noteworthy

Here are the highlighted new and improved features in this maintenance release.

### Framework

### Components

{{changesSincePrevious}}

# Getting Started with Vaadin 14
## App starters
The best way to get started with Vaadin 14 is to go to [https://vaadin.com/start](https://vaadin.com/start) and pick an app template for the technology stack you’re interested in. 

For the full list of how to get started go to the [GitHub releases](https://github.com/vaadin/platform/releases/tag/14.0.0).

# Known Issues and Limitations

## OSGi support
- OSGi with npm does not work in V14.0.0. We are working on a fix for V14.x.
- OSGi with Bower has problems with V14.0.0 but we are working on a fix to be released in a maintenance version (V14.0.X)

## Flow
- The Template-in-Template feature has [some limitations](https://github.com/vaadin/flow/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+label%3Atemplate-in-template+)
- There are [some issues](https://github.com/vaadin/flow/issues/5146) in using Web Sockets as the Push channel in certain OSGi environments, but long polling works.

## Components
- The dark theme preset does not work in IE11 when applied to the `<html>` element.

## Designer
- External preview doesn't work in IE11.
- Horizontal scrolling using the trackpad doesn't work Eclipse.

# Reporting Issues
We appreciate if you try to find the most relevant repository to report the issue in. If it is not obvious which project to add issues to, you are always welcome to report any issue at https://github.com/vaadin/platform/issues.

A few rules of thumb will help you and us in finding the correct repository for the issue:
1) If you encounter an issue when using the HTML/JS API of a component or the component renders incorrectly, the problem is likely in the web component. The web component repositories are named like https://github.com/vaadin/vaadin-button
2) If you encounter an issue when using the Java API of a component, the problem is likely in the Flow integration of the web component. The Flow component integration repositories are named like https://github.com/vaadin/vaadin-button-flow
3) If you encounter an issue with Flow which does not seem to be related to a specific component, the problem is likely in Flow itself. The Flow repository is https://github.com/vaadin/flow
4) If you encounter an issue with Designer, the repository is https://github.com/vaadin/designer
5) If you encounter an issue with TestBench, the repository is https://github.com/vaadin/testbench
