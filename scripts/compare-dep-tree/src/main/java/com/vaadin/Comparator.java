package com.vaadin;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.beust.jcommander.JCommander;
import com.vaadin.dircompare.Arguments;

import japicmp.cmp.JApiCmpArchive;
import japicmp.cmp.JarArchiveComparator;
import japicmp.cmp.JarArchiveComparatorOptions;
import japicmp.filter.JavadocLikePackageFilter;
import japicmp.model.AccessModifier;
import japicmp.model.JApiChangeStatus;
import japicmp.model.JApiClass;
import japicmp.model.JApiCompatibilityChange;
import japicmp.model.JApiCompatibilityChangeType;
import japicmp.util.Optional;
import japicmp.versioning.SemanticVersion;

public class Comparator {

    private final static Set<JApiCompatibilityChangeType> relevantChanges = new HashSet<>();

    public static void main(String[] args) {

        Arguments arguments = new Arguments();
        JCommander.newBuilder().addObject(arguments).build().parse(args);

        String home = arguments.rootDir!=null? arguments.rootDir : System.getProperty("user.home");
        Path vaadinRepositoryRoot = Paths.get(home, ".m2", "repository", "com", "vaadin");

        System.out.printf("Comparing version %s with %s. Looking for standard maven directory in %s.\n", arguments.oldVersion, arguments.newVersion, home);


        JarArchiveComparatorOptions comparatorOptions = new JarArchiveComparatorOptions();
        comparatorOptions.setAccessModifier(AccessModifier.PUBLIC);
        comparatorOptions.getIgnoreMissingClasses().setIgnoreAllMissingClasses(true);
        comparatorOptions.getFilters().getExcludes().add(new JavadocLikePackageFilter("com.vaadin.copilot", false));
        JarArchiveComparator jarArchiveComparator = new JarArchiveComparator(comparatorOptions);


        List<JApiCmpArchive> oldArchives = new ArrayList<>();
        List<JApiCmpArchive> newArchives = new ArrayList<>();

        try (Stream<Path> pathsOld = Files.find(vaadinRepositoryRoot, Integer.MAX_VALUE,
                (path, attr) -> attr.isRegularFile() && path.toString().contains(arguments.oldVersion)
                        && path.toString().endsWith(".jar"));

                Stream<Path> pathsNew = Files.find(vaadinRepositoryRoot, Integer.MAX_VALUE,
                        (path, attr) -> attr.isRegularFile() && path.toString().contains(arguments.newVersion)
                                && path.toString().endsWith(".jar"));) {

            oldArchives = pathsOld.map(p -> p.toFile()).map(f -> new JApiCmpArchive(f, guessVersion(f)))
                    .collect(Collectors.toList());
            newArchives = pathsNew.map(p -> p.toFile()).map(f -> new JApiCmpArchive(f, guessVersion(f)))
                    .collect(Collectors.toList());

        } catch (IOException io) {
            io.printStackTrace();
        }

        if(oldArchives.size()==0){
            System.out.println("No files found for version: "+arguments.oldVersion+". Exiting.");
            System.exit(-1);
        }
        if(newArchives.size()==0){
            System.out.println("No files found for version: "+arguments.newVersion+". Exiting.");
            System.exit(-1);
        }

        //do the comparison and print out differences
        List<JApiClass> differences = jarArchiveComparator.compare(oldArchives, newArchives);
        differences.stream()
            .filter(c -> c.getChangeStatus() != JApiChangeStatus.UNCHANGED && containsRelevantChange(c.getCompatibilityChanges()))
            .forEach(Comparator::print);
    }

    private static void print(JApiClass c) {
        switch (c.getChangeStatus()) {
            case NEW:
                System.out.printf("Change in %s: %s.\n", c.getFullyQualifiedName(), c.getCompatibilityChanges());
                break;
        
            default:
                System.out.println("Change occured: "+c );
                break;
        }
    }

    private static boolean containsRelevantChange(List<JApiCompatibilityChange> changes) {

        for (var c : changes) {
            if (relevantChanges.contains(c.getType())) {
                return true;
            }
        }
        return false;
    }

    private static String guessVersion(File file) {
        String name = file.getName();
        Optional<SemanticVersion> semanticVersion = japicmp.versioning.Version.getSemanticVersion(name);
        String version = semanticVersion.isPresent() ? semanticVersion.get().toString() : "n.a.";
        if (name.contains("SNAPSHOT")) {
            version += "-SNAPSHOT";
        }
        return version;
    }

    static {
        relevantChanges.add(JApiCompatibilityChangeType.METHOD_ADDED_TO_INTERFACE);
        relevantChanges.add(JApiCompatibilityChangeType.METHOD_ADDED_TO_PUBLIC_CLASS);
        relevantChanges.add(JApiCompatibilityChangeType.CLASS_NO_LONGER_PUBLIC);
        relevantChanges.add(JApiCompatibilityChangeType.CLASS_REMOVED);
        relevantChanges.add(JApiCompatibilityChangeType.CLASS_LESS_ACCESSIBLE);
        relevantChanges.add(JApiCompatibilityChangeType.METHOD_REMOVED);
        relevantChanges.add(JApiCompatibilityChangeType.METHOD_REMOVED_IN_SUPERCLASS);
        //these might be of further interest
        //make sure to add them to the print function for specific outputs
        // relevantChanges.add(JApiCompatibilityChangeType.INTERFACE_ADDED);
        // relevantChanges.add(JApiCompatibilityChangeType.ANNOTATION_ADDED);
        // relevantChanges.add(JApiCompatibilityChangeType.ANNOTATION_MODIFIED);
        // relevantChanges.add(JApiCompatibilityChangeType.ANNOTATION_REMOVED);
    }

}