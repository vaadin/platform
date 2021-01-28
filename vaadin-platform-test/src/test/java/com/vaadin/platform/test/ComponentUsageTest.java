package com.vaadin.platform.test;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Collection;
import java.util.Comparator;
import java.util.Enumeration;
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
import com.vaadin.flow.component.dependency.JsModule;

public class ComponentUsageTest {

    private static final String JAVA_VIEW = "src/main/java/com/vaadin/platform/test/ComponentsView.java";
    private static final String TS_VIEW = "src/main/java/com/vaadin/platform/test/ComponentsView.java";
    private static final String SKIP_CLASSES = ".*(BeanUtil).*";

    private static class AnnotatedClasses {
        Set<Class<?>> classes = new HashSet<>();
        Set<String> values = new HashSet<>();

        Set<String> filter(String regex) {
            return values.stream().filter(v -> v.matches(regex)).map(s -> s.replaceFirst(regex, "$1")).sorted()
                    .collect(Collectors.toSet());
        }
    }

    @Test
    public void testComponentUsage() throws Exception {
        System.out.println("Visiting classes available in the classpath ...");
        Set<Class<?>> allClasses = getAllKnownClasses();
        System.out.printf("There are %s classes available in the classpath\n", allClasses.size());
        allClasses = getMatchingClasses(allClasses, Component.class);
        System.out.printf("There are %s Components in the classpath\n", allClasses.size());
        allClasses = getMatchingClasses(allClasses, "^com\\.vaadin\\.flow\\.component\\.\\w+\\..*$");
        System.out.printf("There are %s Flow Components available in the classpath\n", allClasses.size());

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
        System.out.printf("There are %s JsModule annotated classes available in the classpath\n",
                annotatedClasses.classes.size());


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

// Prepared for testing fusion ts view when it's available
//
//        File tsViewFile = new File(TS_VIEW);
//        assertTrue("TS File Unavailable " + tsViewFile.getName(), tsViewFile.canRead());
//        List<String> tsLines = FileUtils.readLines(tsViewFile, "UTF-8");
//        Set<String> vaadinImports = annotatedClasses.filter("^(@vaadin/vaadin-.*/[\\w-]+)\\.js$");
//        List<String> jsImportRegexs = vaadinImports.stream().map(s -> "^\\s*import\\s+'" + s + "'; *")
//                .collect(Collectors.toList());
//        List<String> jsImports = vaadinImports.stream().map(s -> "import '" + s + "';").collect(Collectors.toList());
//        Set<String> vaadinComponents = annotatedClasses.filter("^@vaadin/vaadin-.*/([\\w-]+)\\.js$");
//        List<String> jsRenderRegexs = vaadinComponents.stream().map(s -> "^.*</?" + s + ">.*")
//                .collect(Collectors.toList());
//        List<String> jsComponents = vaadinComponents.stream().map(s -> "<" + s + ">").collect(Collectors.toList());
//        checkedList = checkLines(tsLines, jsImportRegexs, jsImports);
//        if (!checkedList.isEmpty()) {
//            fail = true;
//            System.out.printf("\n>>> There are %s web-components imports missing in %s\n   %s\n", checkedList.size(),
//                    javaViewFile.getName(), String.join("\n   ", checkedList));
//        }
//
//        checkedList = checkLines(tsLines, jsRenderRegexs, jsComponents);
//        if (!checkedList.isEmpty()) {
//            fail = true;
//            System.out.printf("\n>>> There are %s web-components not rendered in %s\n   %s\n", checkedList.size(),
//                    javaViewFile.getName(), String.join("\n   ", checkedList));
//        }

        assertFalse("There are missing components in the smoke tests", fail);
    }

    private List<String> checkLines(List<String> fileContent, List<String> regexs, List<String> source) {
        return regexs.stream().map(regex -> {
            Optional<String> line = fileContent.stream().filter(l -> l.matches(regex)).findFirst();
            return !line.isPresent() ? source.get(regexs.indexOf(regex)) : null;
        }).filter(s -> s != null).collect(Collectors.toList());
    }

    private Set<Class<?>> getAllKnownClasses() {
        Set<Class<?>> classFiles = new HashSet<>();
        for (File file : getClassLocationsForCurrentClasspath()) {
            classFiles.addAll(getClassesFromPath(file));
        }
        return classFiles;
    }

    static Set<Class<?>> getMatchingClasses(final Set<Class<?>> classes, Class<?> interfaceOrSuperclass) {
        return classes.stream()
                .filter(c -> !c.getName().contains("$") && interfaceOrSuperclass.isAssignableFrom(c)
                        && !Modifier.isAbstract(c.getModifiers()) && Modifier.isPublic(c.getModifiers()))
                .collect(Collectors.toCollection(() -> new TreeSet<>(Comparator.comparing(Class::getName))));
    }

    static Set<Class<?>> getMatchingClasses(final Set<Class<?>> classes, String regex) {
        return classes.stream().filter(c -> c.getName().matches(regex))
                .collect(Collectors.toCollection(() -> new TreeSet<>(Comparator.comparing(Class::getName))));
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

    static AnnotatedClasses getAnnotatedClasses(Set<Class<?>> classes,
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
