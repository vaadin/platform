package com.vaadin.prodbundle;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

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

        Assertions.assertEquals(JsonUtil.stringify(unoptimizedStats, 2),
                JsonUtil.stringify(optimizedStats, 2));

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
