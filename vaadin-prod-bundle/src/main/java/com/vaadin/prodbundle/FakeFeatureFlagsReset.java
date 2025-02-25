package com.vaadin.prodbundle;

import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.List;

import com.vaadin.flow.server.frontend.Options;
import com.vaadin.flow.server.frontend.TypeScriptBootstrapModifier;
import com.vaadin.flow.server.frontend.scanner.FrontendDependenciesScanner;

import static com.vaadin.flow.server.frontend.FrontendUtils.FEATURE_FLAGS_FILE_NAME;
import static com.vaadin.flow.server.frontend.FrontendUtils.GENERATED;

/**
 * Disables all feature flags in the bundle before running Vite build.
 */
public class FakeFeatureFlagsReset implements TypeScriptBootstrapModifier {

    @Override
    public void modify(List<String> bootstrapTypeScript, Options options, FrontendDependenciesScanner frontendDependenciesScanner) {
        File frontendGeneratedDirectory = new File(
                options.getFrontendDirectory(), GENERATED);
        Path featureFlagsJS = new File(frontendGeneratedDirectory, FEATURE_FLAGS_FILE_NAME).toPath();
        if (Files.exists(featureFlagsJS)) {
            try {
                Files.write(featureFlagsJS,
                        Files.readAllLines(featureFlagsJS)
                                .stream().map(line -> {
                                    if (line.startsWith("window.Vaadin.featureFlags.") && line.endsWith("= true;")) {
                                        return line.replace("= true;", "= false;");
                                    }
                                    return line;
                                }).toList(), StandardOpenOption.TRUNCATE_EXISTING);

            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        }
    }
}
