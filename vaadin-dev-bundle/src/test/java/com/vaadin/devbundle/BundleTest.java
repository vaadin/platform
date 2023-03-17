package com.vaadin.devbundle;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.FileVisitor;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class BundleTest {

    @Test
    public void usageStatsIncluded() throws IOException {
        String needle = "StatisticsGatherer";
        Path bundlerBuildFolder = Paths.get("src", "main", "dev-bundle", "webapp", "VAADIN", "build");
        AtomicInteger foundInFiles = new AtomicInteger();
        Files.walkFileTree(bundlerBuildFolder, new FileVisitor<Path>() {

            @Override
            public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs)
                    throws IOException {
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                String content = FileUtils.readFileToString(file.toFile(), StandardCharsets.UTF_8);
                if (content.contains(needle)) {
                    foundInFiles.incrementAndGet();
                }
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(Path file, IOException exc) throws IOException {
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                return FileVisitResult.CONTINUE;
            }

        });
        Assertions.assertEquals(1, foundInFiles.get(), "The key '" + needle + "'' should be found in one file");
    }
}
