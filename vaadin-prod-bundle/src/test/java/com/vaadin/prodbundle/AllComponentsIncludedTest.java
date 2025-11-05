package com.vaadin.prodbundle;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.github.difflib.DiffUtils;
import com.github.difflib.UnifiedDiffUtils;
import com.github.difflib.patch.Patch;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

public class AllComponentsIncludedTest {

    private static final Set<String> lazyComponentFiles = Set.of(
            "@vaadin/charts/src/vaadin-chart.js",
            "@vaadin/icons/vaadin-iconset.js",
            "@vaadin/map/src/vaadin-map.js",
            "@vaadin/rich-text-editor/src/vaadin-rich-text-editor.js",
            "@vaadin/vaadin-lumo-styles/vaadin-iconset.js",
            "Frontend/generated/jar-resources/vaadin-map/mapConnector.js",
            "Frontend/generated/jar-resources/vaadin-map/synchronization/index.js",
            "Frontend/generated/jar-resources/vaadin-spreadsheet/spreadsheet-export.js",
            "Frontend/generated/jar-resources/vaadin-spreadsheet/vaadin-spreadsheet.js",
            "Frontend/generated/jar-resources/vaadin-spreadsheet/vaadin-spreadsheet-styles.js",
            "ol/proj",
            "proj4");

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    public void compareStatsWithUnoptimized() throws IOException {
        ObjectNode unoptimizedStats = getStats(
                "vaadin-prod-bundle-unoptimized/config/stats.json");
        ObjectNode optimizedStats = getStats(
                "META-INF/VAADIN/config/stats.json");

        unoptimizedStats.remove("entryScripts");
        optimizedStats.remove("entryScripts");
        unoptimizedStats.remove("indexHtmlGenerated");
        optimizedStats.remove("indexHtmlGenerated");

        ((ObjectNode) unoptimizedStats.get("frontendHashes")).remove("theme-util.js");

        // Pretty print both for diffing
        String unoptPretty = MAPPER.writerWithDefaultPrettyPrinter()
                .writeValueAsString(unoptimizedStats);
        String optPretty = MAPPER.writerWithDefaultPrettyPrinter()
                .writeValueAsString(optimizedStats);

        List<String> unoptJson = new ArrayList<>(
                List.of(unoptPretty.split("\n")));
        List<String> optJson = new ArrayList<>(
                List.of(optPretty.split("\n")));

        if (!unoptJson.equals(optJson)) {
            Patch<String> patch = DiffUtils.diff(unoptJson, optJson);
            List<String> unifiedDiff = UnifiedDiffUtils.generateUnifiedDiff(
                    "unoptimized-stats.json", "optimized-stats.json", unoptJson,
                    patch, 5);
            Assertions.fail(String.join("\n", unifiedDiff));
        }

    }

    @Test
    public void compareBundleImportsWithEagerLoading() throws IOException {
        // This tries to ensure that no components are not marked as eager but
        // still included as part of a lazy component, like checkbox group is a
        // dependency of spreadsheet but should still be in the eager bundle

        ObjectNode optimizedStats = getStats(
                "META-INF/VAADIN/config/stats.json");

        List<String> bundleImports = new ArrayList<>();
        if (optimizedStats.has("bundleImports") && optimizedStats.get("bundleImports").isArray()) {
            for (JsonNode node : optimizedStats.get("bundleImports")) {
                bundleImports.add(node.asText());
            }
        }

        File generatedImports = Path.of("src", "main", "frontend", "generated",
                "flow", "generated-flow-imports.js").toFile();
        Assertions.assertTrue(generatedImports.exists(),
                "Generated imports file " + generatedImports.getAbsolutePath()
                        + " is missing");

        List<String> imports = FileUtils.readLines(generatedImports,
                StandardCharsets.UTF_8);
        Set<String> eagerImports = new HashSet<>(imports.stream()
                .filter(row -> row.startsWith("import '")).map(row -> row
                        .replaceFirst("^import '", "").replaceFirst("';$", ""))
                .toList());

        for (String bundleImport : bundleImports) {
            boolean shouldBeLazy = lazyComponentFiles.contains(bundleImport);
            if (shouldBeLazy) {
                Assertions.assertFalse(eagerImports.contains(bundleImport), "'"
                        + bundleImport
                        + "' is marked as part of a lazy loaded component but loaded eagerly.");
            } else {
                Assertions.assertTrue(eagerImports.remove(bundleImport), "'"
                        + bundleImport
                        + "' is included but not eagerly loaded. If it is part of a lazy loaded component only, update this test. Otherwise, include the relevant component in "
                        + EagerView.class.getName());
            }
        }
    }

    private ObjectNode getStats(String resource) throws IOException {
        try (InputStream stream = getClass().getClassLoader()
                .getResourceAsStream(resource)) {
            if (stream == null) {
                throw new IOException("Unable to find stats resources "
                        + resource + " in the classpath");
            }

            String string = IOUtils.toString(stream, StandardCharsets.UTF_8);
            JsonNode root = MAPPER.readTree(string);
            if (!(root instanceof ObjectNode)) {
                throw new IOException("Invalid JSON format: expected an object at root in " + resource);
            }
            return (ObjectNode) root;
        }
    }
}
