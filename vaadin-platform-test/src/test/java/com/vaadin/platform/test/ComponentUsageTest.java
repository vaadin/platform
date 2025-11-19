package com.vaadin.platform.test;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.Test;

import com.google.common.collect.ImmutableSet;
import com.google.common.reflect.ClassPath;
import com.google.common.reflect.ClassPath.ClassInfo;
import com.vaadin.experimental.FeatureFlags;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.Tag;
import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.di.Lookup;
import com.vaadin.testbench.TestBenchElement;
import com.vaadin.testbench.elementsbase.Element;

public class ComponentUsageTest {

    private static final String JAVA_VIEW = "src/main/java/com/vaadin/platform/test/ComponentsView.java";
    private static final String TS_VIEW = "../vaadin-platform-hybrid-test/frontend/views/components/components-view.ts";

    // CustomField is abstract
    // RadioButton is not public

    public static class TestComponent {
        public Class<? extends Component> component;
        public Class<? extends TestBenchElement> tbElement;
        public String localName;
        public List<String> imports;
        public String tag;
        public String tbEquivalentName;

        public TestComponent(Class<? extends Component> component, Class<? extends TestBenchElement> tbElement,
                String tbEquivalentName, String localName, List<String> imports, String tag) {
            this.component = component;
            this.tbElement = tbElement;
            this.localName = localName;
            this.imports = imports;
            this.tbEquivalentName = tbEquivalentName;
            this.tag = tag;
        }

        @Override
		public String toString() {
			return "   ComponentName: " + (component == null ? "" : component.getName()) + "\n   TBElementName: "
					+ (tbElement == null ? "" : tbElement.getName()) + "\n   Imports: " + imports + "\n   LocalName: "
					+ localName + " - Tag: " + tag;
		}
    }

    @SuppressWarnings({ "rawtypes", "unchecked" })
    private <T> List<Class<? extends T>> filterByType(Collection<Class<?>> list, Class<T> type) {
        FeatureFlags featureFlags = new FeatureFlags(new Lookup() {
            @Override
            public <T> Collection<T> lookupAll(Class<T> serviceClass) {
                return null;
            }

            @Override
            public <T> T lookup(Class<T> serviceClass) {
                return null;
            }
        });
        List<String> experimentalNamespaces = featureFlags.getFeatures()
                .stream().filter(f -> f.getComponentClassName() != null)
                .map(f -> f.getComponentClassName().replaceFirst("\\.[^\\.]+$",
                        ""))
                .collect(Collectors.toList());

        return (List) list.stream()
                .filter(clz -> type.isAssignableFrom(clz) && !clz.getName().contains("$")
                        && Modifier.isPublic(clz.getModifiers()) && !Modifier.isAbstract(clz.getModifiers())
                        && !experimentalNamespaces.contains(clz.getPackageName()))
                .collect(Collectors.toList());
    }

    private final Collection<TestComponent> testComponents = new ArrayList<>();

    public Collection<TestComponent> getTestComponents() {
        return testComponents;
    }

    public ComponentUsageTest() throws Exception {
        ClassLoader cl = getClass().getClassLoader();
        ImmutableSet<ClassInfo> classInfos = ClassPath.from(cl)
                .getTopLevelClassesRecursive("com.vaadin.flow.component");
        List<Class<?>> vaadinClasses = classInfos.stream().map(ci -> ci.load()).collect(Collectors.toList());
        List<Class<? extends Component>> allComponentClasses = filterByType(vaadinClasses, Component.class);
        List<Class<? extends TestBenchElement>> allTBElementClasses = filterByType(vaadinClasses,
                TestBenchElement.class);

        List<String> allComponentNames = allComponentClasses.stream().map(c -> c.getName())
                .collect(Collectors.toList());
        List<String> allTBElementNames = allTBElementClasses.stream().map(c -> c.getName())
                .collect(Collectors.toList());
        List<List<String>> allJsImports = allComponentClasses.stream()
                .map(c -> getValues(c, JsModule.class).stream().collect(Collectors.toList()))
                .collect(Collectors.toList());
        List<String> allComponentTags = allComponentClasses.stream().map(c -> getValue(c, Tag.class))
                .collect(Collectors.toList());
        List<String> allTBElementTags = allTBElementClasses.stream().map(c -> getValue(c, Element.class))
                .collect(Collectors.toList());

        HashMap<String, TestComponent> byComponent = new HashMap<>();
        HashMap<String, TestComponent> byTbElement = new HashMap<>();
        HashMap<String, TestComponent> byTag = new HashMap<>();

        for (int i = 0; i < allComponentClasses.size(); i++) {
            Class<? extends Component> component = allComponentClasses.get(i);
            String componentName = allComponentNames.get(i);
            String componentTag = allComponentTags.get(i);
            List<String> imports = allJsImports.get(i);
            if (componentTag == null) {
                continue;
            }

            String equivalent = component.getName().replaceFirst("(.*)\\.(.*)", "$1.testbench.$2Element");

            Class<? extends TestBenchElement> tbElement = null;
            String tbElementTag = null;

            int j = allTBElementNames.indexOf(equivalent);
            if (j >= 0) {
                tbElement = allTBElementClasses.get(j);
                tbElementTag = allTBElementTags.get(j);
            }
            TestComponent testComponent = new TestComponent(component, tbElement, equivalent, componentTag, imports,
                    tbElementTag);
            byComponent.put(componentName, testComponent);
            byTag.put(componentTag, testComponent);
            testComponents.add(testComponent);
            if (j >= 0) {
                byTbElement.put(equivalent, testComponent);
            }
        }

        for (int i = 0; i < allTBElementClasses.size(); i++) {
            Class<? extends TestBenchElement> tbElement = allTBElementClasses.get(i);
            String tbElementName = allTBElementNames.get(i);
            if (byTbElement.containsKey(tbElementName)) {
                continue;
            }
            String tbTag = allTBElementTags.get(i);
            if ("vaadin-context-menu-overlay".equals(tbTag)) {
                // Exclude ContextMenuOverlayElement since it's broken in V25
                continue;
            }
            if ("*".equals(tbTag)) {
                // some special components like GridTRElement has the * selector
                continue;
            }
            TestComponent testComponent = byTag.get(tbTag);
            if (testComponent != null) {
                testComponent.tbElement = tbElement;
                testComponent.tag = tbTag;
                byTbElement.put(tbElementName, testComponent);
                continue;
            }
            testComponents.add(new TestComponent(null, tbElement, null, null, Collections.emptyList(), tbTag));
        }
    }

    @Test
    public void verifyComponents() throws Exception {
        testComponents.forEach(c -> {
            if (c.component == null) {
                System.err.printf("ERROR: no Flow-Component for TB-Element %s - %s\n", c.tag, c.tbElement.getName());
            }
            if (c.tbElement == null) {
                System.err.printf("ERROR: no TB-Element for Flow-Component %s - %s\n", c.localName,
                        c.component.getName());
            }
            if (c.component != null) {
                String equivalent = c.component.getName().replaceFirst("(.*)\\.(.*)", "$1.testbench.$2Element");
                if (!equivalent.equals(c.tbEquivalentName)) {
                    System.err.printf("ERROR: TB-Element does not follow name convention %s should be %s\n",
                            c.tbElement.getName(), c.tbEquivalentName);
                }
            }
            if (c.component != null && c.tbElement != null && !c.localName.equals(c.tag)) {
                System.err.printf("ERROR: different tags used in TB-Element and Flow-Component %s %s %s %s\n",
                        c.localName, c.tag, c.component.getName(), c.tbElement.getName());
            }
        });
    }

    @Test
    public void testComponentUsage() throws Exception {
        List<Class<? extends Component>> allClasses = testComponents.stream().filter(tc -> tc.component != null)
                .map(tc -> tc.component).collect(Collectors.toList());

        List<String> javaImportRegexs = allClasses.stream().map(c -> ".*[^\\w](" + c.getName() + ")[^\\w].*")
                .collect(Collectors.toList());
        List<String> javaImports = allClasses.stream().map(c -> "import " + c.getName() + ";")
                .collect(Collectors.toList());
        List<String> javaVarRegexs = allClasses.stream().map(c -> "^\\s*([\\w\\.]+\\.)?(" + c.getSimpleName()
                + " *(<.*>)? *" + uncapitalize(c.getSimpleName()) + ") *[;=].*")
                .collect(Collectors.toList());
        List<String> javaVars = allClasses.stream()
                .map(c -> c.getSimpleName() + " " + uncapitalize(c.getSimpleName()) + " =")
                .collect(Collectors.toList());

        File javaViewFile = new File(JAVA_VIEW);
        assertTrue("Java File Unavailable " + javaViewFile.getName(), javaViewFile.canRead());
        List<String> javaLines = java.nio.file.Files.readAllLines(javaViewFile.toPath(), java.nio.charset.StandardCharsets.UTF_8);

        boolean fail = false;
        List<String> checkedList;

        checkedList = checkLines(javaLines, javaImportRegexs, javaImports);
        if (!checkedList.isEmpty()) {
            fail = true;
            System.out.printf("\n>>> There are %s imports missing in %s\n   %s\n", checkedList.size(),
                    javaViewFile.getName(), String.join("\n   ", checkedList));
        }

        checkedList = checkLines(javaLines, javaVarRegexs, javaVars);
        if (!checkedList.isEmpty()) {
            fail = true;
            System.out.printf("\n>>> There are %s components not used in %s\n   %s\n", checkedList.size(),
                    javaViewFile.getName(), String.join("\n   ", checkedList));
        }

        Set<String> vaadinComponents = testComponents.stream().filter(tc -> tc.imports.size() > 0)
                .flatMap(tc -> tc.imports.stream()).filter(s -> s.matches("^@vaadin/.*$"))
                .map(s -> s.replaceFirst(".*/(.*)\\.js$", "$1")).collect(Collectors.toSet());

        Set<String> vaadinImports = testComponents.stream().filter(tc -> tc.imports.size() > 0)
                .flatMap(tc -> tc.imports.stream()).filter(s -> s.matches("^@vaadin/.*$"))
                .map(s -> s.replaceFirst(".[tj]s$", "")).collect(Collectors.toSet());

        List<String> jsImportRegex1s = vaadinImports.stream()
                .map(s -> "^\\s*import\\s+'" + s.replaceFirst("/src/", "/(src/|)") + "'; *")
                .collect(Collectors.toList());
        List<String> jsImportRegexs = vaadinImports.stream().map(s -> {
            String[] t = s.split("/");
            if (t.length == 4 && t[2].equals("src") && t[1].equals(t[3].replaceFirst("^vaadin-", ""))) {
                return "^\\s*import\\s+'(" + t[0] + "/" + t[1] + "|" + s + ")'; *";
            } else {
                return "^\\s*import\\s+'" + s + "'; *";
            }
        }).collect(Collectors.toList());
        List<String> jsImports = vaadinImports.stream().map(s -> {
            String[] t = s.split("/");
            if (t.length == 4 && t[2].equals("src") && t[1].equals(t[3].replaceFirst("^vaadin-", ""))) {
                return "import '" + t[0] + "/" + t[1] + "';";
            } else {
                return "import '" + s + "';";
            }
        }).collect(Collectors.toList());
        List<String> jsRenderRegexs = vaadinComponents.stream().map(s -> "^.*</?" + s + ">.*")
                .collect(Collectors.toList());
        List<String> jsComponents = vaadinComponents.stream().map(s -> "<" + s + "></" + s + ">")
                .collect(Collectors.toList());

        File tsViewFile = new File(TS_VIEW);
        assertTrue("TS File Unavailable " + tsViewFile.getName(), tsViewFile.canRead());
        List<String> tsLines = FileUtils.readLines(tsViewFile, "UTF-8");

        checkedList = checkLines(tsLines, jsImportRegexs, jsImports);
        if (!checkedList.isEmpty()) {
            fail = true;
            System.out.printf("\n>>> There are %s web-components imports missing in %s\n   %s\n", checkedList.size(),
                    tsViewFile.getName(), String.join("\n   ", checkedList));
        }

        checkedList = checkLines(tsLines, jsRenderRegexs, jsComponents);
        if (!checkedList.isEmpty()) {
            fail = true;
            System.out.printf("\n>>> There are %s web-components not rendered in %s\n   %s\n", checkedList.size(),
                    tsViewFile.getName(), String.join("\n   ", checkedList));
        }

        assertFalse("There are missing components in the smoke tests", fail);
    }

    private List<String> checkLines(List<String> fileContent, List<String> regexs, List<String> source) {
        return regexs.stream().map(regex -> {
            Optional<String> line = fileContent.stream().filter(l -> {
                return l.matches(regex);
            }).findFirst();
            return !line.isPresent() ? (source.get(regexs.indexOf(regex)) /* + " " + regex */) : null;
        }).filter(s -> s != null).sorted().collect(Collectors.toList());
    }

    private static String getValue(Class<?> claz, Class<? extends Annotation> annotation) {
        List<String> values = getValues(claz, annotation);
        return values.size() > 0 ? values.get(0) : null;
    }

    private static List<String> getValues(Class<?> claz, Class<? extends Annotation> annotation) {
        List<String> wcs = new ArrayList<>();
        Annotation[] anns = claz.getAnnotationsByType(annotation);
        for (Annotation ann : anns) {
            wcs.addAll(getValues(ann));
        }
        Annotation ann = claz.getAnnotation(annotation);
        if (ann != null) {
            wcs.addAll(getValues(ann));
        }
        return wcs;
    }

    private static Set<String> getValues(Annotation ann) {
        Set<String> values = new HashSet<>();
        if (ann != null) {
            Class<? extends Annotation> type = ann.annotationType();
            try {
                Method m = type.getDeclaredMethod("value", (Class<?>[]) null);
                String val = m.invoke(ann, (Object[]) null).toString();
                values.add(val);
            } catch (Exception ignore) {
            }
        }
        return values;
    }

    private static String uncapitalize(String s) {
        if (s == null || s.isEmpty()) {
            return s;
        }
        return Character.toLowerCase(s.charAt(0)) + s.substring(1);
    }
}
