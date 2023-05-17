package com.vaadin.prodbundle;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import com.github.difflib.DiffUtils;
import com.github.difflib.UnifiedDiffUtils;
import com.github.difflib.patch.Patch;
import com.github.difflib.unifieddiff.UnifiedDiff;
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import elemental.json.Json;
import elemental.json.JsonObject;
import elemental.json.impl.JsonUtil;

public class AllComponentsIncludedTest {

    @Test
    public void compareStatsWithUnoptimized() throws IOException {
        JsonObject unoptimizedStats = getStats(
                "vaadin-prod-bundle-unoptimized/config/stats.json");
        JsonObject optimizedStats = getStats(
                "META-INF/VAADIN/config/stats.json");

        unoptimizedStats.remove("entryScripts");
        optimizedStats.remove("entryScripts");
        unoptimizedStats.remove("indexHtmlGenerated");
        optimizedStats.remove("indexHtmlGenerated");

        List<String> unoptJson = List
                .of(JsonUtil.stringify(unoptimizedStats, 2).split("\n"));
        List<String> optJson = List
                .of(JsonUtil.stringify(optimizedStats, 2).split("\n"));
        if (!unoptJson.equals(optJson)) {
            Patch<String> patch = DiffUtils.diff(unoptJson, optJson);
            List<String> unifiedDiff = UnifiedDiffUtils.generateUnifiedDiff(
                    "unoptimized-stats.json", "optimized-stats.json", unoptJson,
                    patch, 5);
            Assertions.fail(String.join("\n", unifiedDiff));
        }

    }

    private JsonObject getStats(String resource) throws IOException {
        try (InputStream stream = getClass().getClassLoader()
                .getResourceAsStream(resource)) {
            if (stream == null) {
                throw new IOException("Unable to find stats resources "
                        + resource + " in the classpath");
            }

            String string = IOUtils.toString(stream, StandardCharsets.UTF_8);
            return Json.parse(string);
        }
    }
}
