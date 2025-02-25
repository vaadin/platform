package com.vaadin.prodbundle;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Predicate;
import java.util.regex.Pattern;

import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class FeatureFlagsResetTest {

    @Test
    public void featureFlagsReset() throws IOException {
        Predicate<String> enabledFeatureFlag = Pattern.compile("window\\.Vaadin\\.featureFlags\\..*=!0;").asPredicate();
        int foundInFiles = findInBundleBuildFolder(enabledFeatureFlag);
        Assertions.assertEquals(0, foundInFiles,
                "Expecting all feature flags should be disabled in the dev-bundle");
    }

    private int findInBundleBuildFolder(Predicate<String> matcher)
            throws IOException {
        Path bundlerBuildFolder = Paths.get("target", "classes", "META-INF", "VAADIN", "webapp",
                "VAADIN", "build");
        return findInFiles(bundlerBuildFolder, matcher);
    }

    private int findInFiles(Path path, Predicate<String> matcher)
            throws IOException {
        AtomicInteger foundInFiles = new AtomicInteger();
        Files.walkFileTree(path, new SimpleFileVisitor<>() {

            @Override
            public FileVisitResult visitFile(Path file,
                                             BasicFileAttributes attrs) throws IOException {
                if (file.getFileName().toString().endsWith(".js")) {
                    List<String> lines = FileUtils.readLines(file.toFile(),
                            StandardCharsets.UTF_8);
                    for (String line : lines) {
                        if (matcher.test(line)) {
                            foundInFiles.incrementAndGet();
                            break;
                        }
                    }
                }
                return FileVisitResult.CONTINUE;
            }
        });
        return foundInFiles.get();

    }


}
