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
        int foundInFiles = findInBundleBuildFolder(needle);
        Assertions.assertEquals(1, foundInFiles,
                "The key '" + needle + "' should be found in one file");
    }
    @Test
    public void copilotIncluded() throws IOException {
        String needle = "copilot-main";
        int foundInFiles = findInBundleBuildFolder(needle);
        Assertions.assertEquals(1, foundInFiles,
                "The key '" + needle + "' should be found in one file");
    }
    @Test
    public void hillaIncluded() throws IOException {
        String needle = "@vaadin/hilla-frontend";
        int foundInFiles = findInBundleBuildFolder(needle);
        Assertions.assertEquals(1, foundInFiles,
                "The key '" + needle + "' should be found in one file");
    }

    private int findInBundleBuildFolder(String needle) throws IOException {
        Path bundlerBuildFolder = Paths.get("target", "dev-bundle", "webapp",
                "VAADIN", "build");
        return findInFiles(bundlerBuildFolder, needle);
    }

    private int findInFiles(Path path, String needle) throws IOException {
        AtomicInteger foundInFiles = new AtomicInteger();
        Files.walkFileTree(path, new FileVisitor<Path>() {

            @Override
            public FileVisitResult preVisitDirectory(Path dir,
                    BasicFileAttributes attrs) throws IOException {
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFile(Path file,
                    BasicFileAttributes attrs) throws IOException {
                String content = FileUtils.readFileToString(file.toFile(),
                        StandardCharsets.UTF_8);
                if (content.contains(needle)) {
                    foundInFiles.incrementAndGet();
                }
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(Path file, IOException exc)
                    throws IOException {
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path dir, IOException exc)
                    throws IOException {
                return FileVisitResult.CONTINUE;
            }

        });
        return foundInFiles.get();

    }
}
