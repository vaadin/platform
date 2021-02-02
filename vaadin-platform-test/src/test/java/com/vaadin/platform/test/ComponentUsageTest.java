package com.vaadin.platform.test;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.stream.Collectors;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.Tag;
import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.testbench.TestBenchElement;
import com.vaadin.testbench.elementsbase.Element;

public class ComponentUsageTest {

    private static final String JAVA_VIEW = "src/main/java/com/vaadin/platform/test/ComponentsView.java";
    private static final String TS_VIEW = "frontend/views/components-view.ts";
    // TODO: remove this when Fusion tests are on place
    private static final boolean runTs = new File(TS_VIEW).canRead();

    // BeanUtil generates noise to the standard error
    // NativeDetails is not in all branches
    // JavaScriptBootstrapUI|WebComponentUI|WebComponentWrapper are internal components
    private static final String SKIP_CLASSES = ".*\\.(BeanUtil\\$Lazy.+|NativeDetails|JavaScriptBootstrapUI|WebComponentUI|WebComponentWrapper)$";
    // CustomField is abstract
    // RadioButton is not public
    private static final String ADD_CLASSES = ".*\\.(CustomField)$";

    public static class TestComponent {
        public Class<? extends Component> component;
        public Class<? extends TestBenchElement> tbElement;
        public String localName;
        public List<String> imports;
        public String tag;
        public String tbEquivalentName;
        public TestComponent(Class<? extends Component> component, Class<? extends TestBenchElement> tbElement, String tbEquivalentName, String localName, List<String> imports, String tag) {
            this.component = component;
            this.tbElement = tbElement;
            this.localName = localName;
            this.imports = imports;
            this.tbEquivalentName = tbEquivalentName;
            this.tag = tag;
        }
        @Override
        public String toString() {
            return "   " + (component == null ? "" : component.getName()) + "\n   "
                    + (tbElement == null ? "" : tbElement.getName()) + "\n   " + imports + "\n   " + localName + " - "
                    + tag;
        }
    }

    private final Collection<TestComponent> testComponents;

    public Collection<TestComponent> getTestComponents() {
        return testComponents;
    }

    private static class AnnotatedClasses {
        Set<Class<?>> classes = new HashSet<>();
        Set<String> values = new HashSet<>();
        Set<String> filter(String regex) {
            return values.stream().filter(v -> v.matches(regex)).map(s -> s.replaceFirst(regex, "$1")).sorted()
                    .collect(Collectors.toSet());
        }
    }

    @SuppressWarnings("unchecked")
    public  <T extends TestBenchElement> List<Class<T>> getAllTBElementClasses() {
        Set<Class<?>> allClasses = getAllKnownClasses();
        allClasses = getMatchingClasses(allClasses, TestBenchElement.class);
        allClasses = getMatchingClasses(allClasses, "^com\\.vaadin\\.flow\\.component\\.\\w+\\..*$");
        return allClasses.stream().map(c -> (Class<T>)c).collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    public <T extends Component> List<Class<T>> getAllComponentClasses() {
        Set<Class<?>> allClasses = getAllKnownClasses();
        allClasses = getMatchingClasses(allClasses, Component.class);
        allClasses = getMatchingClasses(allClasses, "^com\\.vaadin\\.flow\\.component\\.\\w+\\..*$");
        return allClasses.stream().map(c -> (Class<T>)c).collect(Collectors.toList());
    }

    public ComponentUsageTest() {
        testComponents = new ArrayList<ComponentUsageTest.TestComponent>();
        List<Class<Component>> allComponentClasses = getAllComponentClasses();
        List<Class<TestBenchElement>> allTBElementClasses = getAllTBElementClasses();
        List<String> allComponentNames = allComponentClasses.stream().map(c -> c.getName()).collect(Collectors.toList());
        List<String> allTBElementNames = allTBElementClasses.stream().map(c -> c.getName()).collect(Collectors.toList());
        List<List<String>> allJsImports = allComponentClasses.stream().map(
                c -> getValues(c, JsModule.class).stream().filter(s -> s.matches("^@.*")).collect(Collectors.toList()))
                .collect(Collectors.toList());
        List<String> allComponentTags = allComponentClasses.stream().map(c -> getValue(c, Tag.class)).collect(Collectors.toList());
        List<String> allTBElementTags = allTBElementClasses.stream().map(c -> getValue(c, Element.class)).collect(Collectors.toList());

        HashMap<String, TestComponent> byComponent = new HashMap<>();
        HashMap<String, TestComponent> byTbElement = new HashMap<>();
        HashMap<String, TestComponent> byTag = new HashMap<>();

        for (int i = 0; i < allComponentClasses.size(); i++) {
            Class<Component> component = allComponentClasses.get(i);
            String componentName = allComponentNames.get(i);
            String componentTag = allComponentTags.get(i);
            List<String> imports = allJsImports.get(i);

            String equivalent = component.getName().replaceFirst("(.*)\\.(.*)", "$1.testbench.$2Element");

            Class<TestBenchElement> tbElement = null;
            String tbElementTag = null;

            int j = allTBElementNames.indexOf(equivalent);
            if (j >= 0) {
                tbElement = allTBElementClasses.get(j);
                tbElementTag = allTBElementTags.get(j);
            }
            TestComponent testComponent = new TestComponent(component, tbElement, equivalent, componentTag, imports, tbElementTag);
            byComponent.put(componentName, testComponent);
            byTag.put(componentTag, testComponent);
            testComponents.add(testComponent);
            if (j >= 0) {
                byTbElement.put(equivalent, testComponent);
            }
        }

        for (int i = 0; i < allTBElementClasses.size(); i++) {
            Class<TestBenchElement> tbElement = allTBElementClasses.get(i);
            String tbElementName = allTBElementNames.get(i);
            if (byTbElement.containsKey(tbElementName)) {
                continue;
            }
            String tbTag = allTBElementTags.get(i);
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
                System.err.printf("ERROR: no TB-Element for Flow-Component %s - %s\n", c.localName, c.component.getName());
            }
            if (c.component != null) {
                String equivalent = c.component.getName().replaceFirst("(.*)\\.(.*)", "$1.testbench.$2Element");
                if (!equivalent.equals(c.tbEquivalentName)) {
                    System.err.printf("ERROR: TB-Element does not follow name convention %s should be %s\n", c.tbElement.getName(), c.tbEquivalentName);
                }
            }
            if (c.component != null && c.tbElement != null && !c.localName.equals(c.tag)) {
                System.err.printf("ERROR: different tags used in TB-Element and Flow-Component %s %s %s %s\n", c.localName, c.tag, c.component.getName(), c.tbElement.getName());
            }
        });
    }

    @Test
    public void testComponentUsage() throws Exception {
        List<Class<Component>> allClasses = getAllComponentClasses();

        List<String> javaImportRegexs = allClasses.stream().map(c -> ".*[^\\w](" + c.getName() + ")[^\\w].*")
                .collect(Collectors.toList());
        List<String> javaImports = allClasses.stream().map(c -> "import " + c.getName() + ";")
                .collect(Collectors.toList());
        List<String> javaVarRegexs = allClasses.stream().map(c -> "^\\s*([\\w\\.]+\\.)?(" + c.getSimpleName() + " *(<.*>)? *"
                + StringUtils.uncapitalize(c.getSimpleName()) + ") *[;=].*").collect(Collectors.toList());
        List<String> javaVars = allClasses.stream()
                .map(c -> c.getSimpleName() + " " + StringUtils.uncapitalize(c.getSimpleName()) + " =")
                .collect(Collectors.toList());

        AnnotatedClasses annotatedClasses = getAnnotatedClasses(allClasses, JsModule.class);

        File javaViewFile = new File(JAVA_VIEW);
        assertTrue("Java File Unavailable " + javaViewFile.getName(), javaViewFile.canRead());
        List<String> javaLines = FileUtils.readLines(javaViewFile, "UTF-8");

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

        if (runTs) {
            File tsViewFile = new File(TS_VIEW);
            assertTrue("TS File Unavailable " + tsViewFile.getName(), tsViewFile.canRead());
            List<String> tsLines = FileUtils.readLines(tsViewFile, "UTF-8");
            Set<String> vaadinImports = annotatedClasses.filter("^(@vaadin/vaadin-.*/[\\w-]+)\\.js$");
            List<String> jsImportRegexs = vaadinImports.stream().map(s -> "^\\s*import\\s+'" + s + "'; *")
                    .collect(Collectors.toList());
            List<String> jsImports = vaadinImports.stream().map(s -> "import '" + s + "';").collect(Collectors.toList());
            Set<String> vaadinComponents = annotatedClasses.filter("^@vaadin/vaadin-.*/([\\w-]+)\\.js$");
            List<String> jsRenderRegexs = vaadinComponents.stream().map(s -> "^.*</?" + s + ">.*")
                    .collect(Collectors.toList());
            List<String> jsComponents = vaadinComponents.stream().map(s -> "<" + s + ">").collect(Collectors.toList());
            checkedList = checkLines(tsLines, jsImportRegexs, jsImports);
            if (!checkedList.isEmpty()) {
                fail = true;
                System.out.printf("\n>>> There are %s web-components imports missing in %s\n   %s\n", checkedList.size(),
                        javaViewFile.getName(), String.join("\n   ", checkedList));
            }

            checkedList = checkLines(tsLines, jsRenderRegexs, jsComponents);
            if (!checkedList.isEmpty()) {
                fail = true;
                System.out.printf("\n>>> There are %s web-components not rendered in %s\n   %s\n", checkedList.size(),
                        javaViewFile.getName(), String.join("\n   ", checkedList));
            }
        }

        assertFalse("There are missing components in the smoke tests", fail);
    }

    private List<String> checkLines(List<String> fileContent, List<String> regexs, List<String> source) {
        return regexs.stream().map(regex -> {
            Optional<String> line = fileContent.stream().filter(l -> l.matches(regex)).findFirst();
            return !line.isPresent() ? source.get(regexs.indexOf(regex)) : null;
        }).filter(s -> s != null).collect(Collectors.toList());
    }

    private static Set<Class<?>> classFiles;
    private Set<Class<?>> getAllKnownClasses() {
        if (classFiles == null) {
            System.out.println("Visiting all classes in the classPath ...");
            classFiles = new HashSet<>();
            for (File file : getClassLocationsForCurrentClasspath()) {
                classFiles.addAll(getClassesFromPath(file));
            }
            System.out.printf("Found %s classes.\n", classFiles.size());
        }
        return classFiles;
    }

    static Set<Class<?>> getMatchingClasses(final Set<Class<?>> classes, Class<?> interfaceOrSuperclass) {
        return classes.stream()
                .filter(c -> !c.getName().contains("$") && interfaceOrSuperclass.isAssignableFrom(c)
                        && (c.getName().matches(ADD_CLASSES)
                                || Modifier.isPublic(c.getModifiers()) && !Modifier.isAbstract(c.getModifiers())))
                .collect(Collectors.toCollection(() -> new TreeSet<>(Comparator.comparing(Class::getName))));
    }

    static Set<Class<?>> getMatchingClasses(final Set<Class<?>> classes, String regex) {
        return classes.stream().filter(c -> c.getName().matches(regex))
                .collect(Collectors.toCollection(() -> new TreeSet<>(Comparator.comparing(Class::getName))));
    }


    static String getValue(Class<?> claz, Class<? extends Annotation> annotation) {
        List<String> values = getValues(claz, annotation);
        return values.size() > 0 ? values.get(0) : null;
    }

    static List<String> getValues(Class<?> claz, Class<? extends Annotation> annotation) {
        List<String> wcs = new ArrayList<>();
        Annotation[] anns = claz.getAnnotationsByType(annotation);
        for (Annotation ann : anns) {
            wcs.addAll(getValues(ann));
        }
        return wcs;
    }

    static Set<String> getValues(Annotation ann) {
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

    static AnnotatedClasses getAnnotatedClasses(List<Class<Component>> classes,
            Class<? extends Annotation> interfaceOrSuperclass) {
        AnnotatedClasses wcs = new AnnotatedClasses();
        for (Class<?> claz : classes) {
            Annotation[] anns = claz.getAnnotationsByType(interfaceOrSuperclass);
            if (anns.length > 0) {
                for (Annotation ann : anns) {
                    wcs.values.addAll(getValues(ann));
                }
                wcs.classes.add(claz);
            }
            Annotation ann = claz.getAnnotation(interfaceOrSuperclass);
            if (ann != null) {
                wcs.values.addAll(getValues(ann));
                wcs.classes.add(claz);
            }
        }
        return wcs;
    }

    private Collection<Class<?>> getClassesFromPath(File path) {
        if (path.isDirectory()) {
            return getClassesFromDirectory(path);
        } else {
            return getClassesFromJarFile(path);
        }
    }

    private String fromFileToClassName(final String fileName) {
        return fileName.substring(0, fileName.length() - 6).replaceAll("/|\\\\", "\\.");
    }

    private Set<Class<?>> getClassesFromJarFile(File path) {
        Set<Class<?>> components = new HashSet<>();
        if (path.canRead()) {
            JarFile jar;
            try {
                jar = new JarFile(path);
                Enumeration<JarEntry> en = jar.entries();
                while (en.hasMoreElements()) {
                    JarEntry entry = en.nextElement();
                    if (entry.getName().endsWith("class")) {
                        String className = fromFileToClassName(entry.getName());
                        if (className.matches(SKIP_CLASSES)) {
                            continue;
                        }
                        try {
                            Class<?> claz = Class.forName(className);
                            components.add(claz);
                        } catch (Throwable ignore) {
                        }
                    }
                }
                jar.close();
            } catch (IOException ignore) {
            }
        }
        return components;
    }

    private Set<Class<?>> getClassesFromDirectory(File path) {
        Set<Class<?>> classes = new HashSet<>();

        // get jar files from top-level directory
        Set<File> jarFiles = listFiles(path, new FilenameFilter() {
            @Override
            public boolean accept(File dir, String name) {
                return name.endsWith(".jar");
            }
        }, false);
        for (File file : jarFiles) {
            classes.addAll(getClassesFromJarFile(file));
        }

        // get all class-files
        Set<File> classFiles = listFiles(path, new FilenameFilter() {
            @Override
            public boolean accept(File dir, String name) {
                return name.endsWith(".class");
            }
        }, true);

        int substringBeginIndex = path.getAbsolutePath().length() + 1;
        for (File classfile : classFiles) {
            String className = classfile.getAbsolutePath().substring(substringBeginIndex);
            className = fromFileToClassName(className);
            try {
                classes.add(Class.forName(className));
            } catch (Throwable ignore) {
            }

        }
        return classes;
    }

    private Set<File> listFiles(File directory, FilenameFilter filter, boolean recurse) {
        Set<File> files = new HashSet<>();
        File[] entries = directory.listFiles();

        for (File entry : entries) {
            if (filter == null || filter.accept(directory, entry.getName())) {
                files.add(entry);
            }
            if (recurse && entry.isDirectory()) {
                files.addAll(listFiles(entry, filter, recurse));
            }
        }
        return files;
    }

    private Set<File> getClassLocationsForCurrentClasspath() {
        Set<File> urls = new HashSet<>();
        String javaClassPath = System.getProperty("java.class.path");
        if (javaClassPath != null) {
            for (String path : javaClassPath.split(File.pathSeparator)) {
                urls.add(new File(path));
            }
        }
        return urls;
    }

}
