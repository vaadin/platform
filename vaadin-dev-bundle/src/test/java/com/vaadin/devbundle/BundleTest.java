package com.vaadin.devbundle;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.FileVisitor;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;

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
        int foundInFiles = findInBundleBuildFolder(line -> line.contains(needle)
                && !line.contains("document.querySelector")&& !line.contains("copilot-main-resized"));
        Assertions.assertEquals(1, foundInFiles,
                "The key '" + needle + "' should be found in one file");
    }

    @Test
    public void hillaPackageLockIncluded() throws IOException {
        Path bundlerBuildFolder = Paths.get("target", "dev-bundle",
                "hybrid-package-lock.json");
        Assertions.assertTrue(bundlerBuildFolder.toFile().exists(),
                "Expecting hybrid-package-lock.json to be present in dev-bundle, but was not");
    }

    private int findInBundleBuildFolder(String needle) throws IOException {
        return findInBundleBuildFolder(line -> line.contains(needle));
    }

    private int findInBundleBuildFolder(Function<String, Boolean> matcher)
            throws IOException {
        Path bundlerBuildFolder = Paths.get("target", "dev-bundle", "webapp",
                "VAADIN", "build");
        return findInFiles(bundlerBuildFolder, matcher);
    }

    private int findInFiles(Path path, Function<String, Boolean> matcher)
            throws IOException {
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
                List<String> lines = Files.readAllLines(file,
                        StandardCharsets.UTF_8);
                for (String line : lines) {
                    if (matcher.apply(line)) {
                        foundInFiles.incrementAndGet();
                        break;
                    }
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
