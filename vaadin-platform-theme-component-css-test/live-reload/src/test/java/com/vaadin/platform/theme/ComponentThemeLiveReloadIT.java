/*
 * Copyright 2000-2026 Vaadin Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.vaadin.platform.theme;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.logging.Level;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedCondition;

import com.vaadin.flow.internal.FrontendUtils;
import com.vaadin.testbench.TestBenchElement;

import static com.vaadin.platform.theme.ComponentThemeLiveReloadView.ATTACH_IDENTIFIER;
import static com.vaadin.platform.theme.ComponentThemeLiveReloadView.THEMED_COMPONENT_ID;

/**
 * Adds/updates/deletes a {@code components/vaadin-text-field.css} in the app and
 * parent themes at runtime and verifies Vite HMR pushes the new border-radius
 * into the real {@code vaadin-text-field}'s shadow DOM on the fly.
 */
public class ComponentThemeLiveReloadIT extends AbstractThemeComponentCssTest {

    private static final String BORDER_RADIUS = "11px";
    private static final String OTHER_BORDER_RADIUS = "17px";
    private static final String PARENT_BORDER_RADIUS = "23px";

    private static final String THEMES_FOLDER = FrontendUtils.DEFAULT_FRONTEND_DIR
            + "/themes/";
    private static final String CURRENT_THEME = "app-theme";
    private static final String PARENT_THEME = "parent-theme";
    private static final String CURRENT_THEME_FOLDER = THEMES_FOLDER
            + CURRENT_THEME + "/";
    private static final String PARENT_THEME_FOLDER = THEMES_FOLDER
            + PARENT_THEME + "/";
    private static final String THEME_GENERATED_PATTERN = FrontendUtils.DEFAULT_FRONTEND_DIR
            + "/generated/theme-%s.generated.js";
    private static final String COMPONENT_STYLE_SHEET = "components/vaadin-text-field.css";

    private File currentThemeComponentCSSFile;
    private File currentThemeGeneratedFile;

    private File parentThemeComponentCSSFile;
    private File parentThemeGeneratedFile;

    @Before
    public void init() {
        File baseDir = new File(System.getProperty("user.dir", "."));

        final File currentThemeFolder = new File(baseDir, CURRENT_THEME_FOLDER);
        currentThemeComponentCSSFile = new File(currentThemeFolder,
                COMPONENT_STYLE_SHEET);
        currentThemeGeneratedFile = new File(baseDir,
                String.format(THEME_GENERATED_PATTERN, CURRENT_THEME));

        final File parentThemeFolder = new File(baseDir, PARENT_THEME_FOLDER);
        parentThemeComponentCSSFile = new File(parentThemeFolder,
                COMPONENT_STYLE_SHEET);
        parentThemeGeneratedFile = new File(baseDir,
                String.format(THEME_GENERATED_PATTERN, PARENT_THEME));
    }

    @After
    public void cleanUp() {
        if (currentThemeComponentCSSFile.exists()) {
            doActionAndWaitUntilLiveReloadComplete(
                    this::deleteCurrentThemeComponentStyles);
        }
        if (parentThemeComponentCSSFile.exists()) {
            doActionAndWaitUntilLiveReloadComplete(
                    this::deleteParentThemeComponentStyles);
        }
    }

    @Test
    public void frontendLiveReload_newComponentStylesCreatedAndDeleted_stylesUpdatedOnFly() {
        open("/theme-live-reload");

        // Clear browser logs to avoid checking stale entries.
        getLogEntries(Level.ALL);

        Assert.assertFalse(
                "Border radius for themed component is not expected before "
                        + "applying the styles",
                isComponentCustomStyle(BORDER_RADIUS)
                        || isComponentCustomStyle(OTHER_BORDER_RADIUS));

        // Current theme: live reload on adding component styles.
        doActionAndWaitUntilLiveReloadComplete(
                () -> createOrUpdateComponentCSSFile(BORDER_RADIUS,
                        currentThemeComponentCSSFile));
        waitUntilComponentCustomStyle(BORDER_RADIUS);

        // Current theme: live reload on updating component styles.
        doActionAndWaitUntilLiveReloadComplete(
                () -> createOrUpdateComponentCSSFile(OTHER_BORDER_RADIUS,
                        currentThemeComponentCSSFile));
        waitUntilComponentCustomStyle(OTHER_BORDER_RADIUS);

        // Current theme: live reload on deletion.
        doActionAndWaitUntilLiveReloadComplete(
                this::deleteCurrentThemeComponentStyles);
        waitUntilComponentInitialStyle(
                "Wait for current theme component initial styles timeout");
        checkNoFrontendErrors(CURRENT_THEME);

        // Parent theme: live reload on adding component styles.
        doActionAndWaitUntilLiveReloadComplete(
                () -> createOrUpdateComponentCSSFile(PARENT_BORDER_RADIUS,
                        parentThemeComponentCSSFile));
        waitUntilComponentCustomStyle(PARENT_BORDER_RADIUS);

        // Parent theme: live reload on deletion.
        doActionAndWaitUntilLiveReloadComplete(
                this::deleteParentThemeComponentStyles);
        waitUntilComponentInitialStyle(
                "Wait for parent theme component initial styles timeout");
        checkNoFrontendErrors(PARENT_THEME);
    }

    private void waitUntilComponentInitialStyle(String errMessage) {
        waitUntilWithMessage(
                driver -> !isComponentCustomStyle(BORDER_RADIUS)
                        && !isComponentCustomStyle(OTHER_BORDER_RADIUS)
                        && !isComponentCustomStyle(PARENT_BORDER_RADIUS),
                errMessage);
    }

    private void waitUntilComponentCustomStyle(String borderRadius) {
        waitUntilWithMessage(driver -> isComponentCustomStyle(borderRadius),
                "Wait for component custom styles timeout: " + borderRadius);
    }

    private boolean isComponentCustomStyle(String borderRadius) {
        try {
            waitForElementPresent(By.id(THEMED_COMPONENT_ID));
            TestBenchElement themedTextField = $(TestBenchElement.class)
                    .id(THEMED_COMPONENT_ID);
            TestBenchElement input = themedTextField.$("div")
                    .attribute("class", "vaadin-field-container").first()
                    .$("vaadin-input-container")
                    .attribute("part", "input-field").first();
            return borderRadius.equals(input.getCssValue("border-radius"));
        } catch (StaleElementReferenceException e) {
            return false;
        }
    }

    private void createOrUpdateComponentCSSFile(String borderRadius,
            File componentCssFile) {
        try {
            final String componentStyles = "[part=\"input-field\"] {\n"
                    + "    border-radius: " + borderRadius + ";\n" + "}";
            componentCssFile.getParentFile().mkdirs();
            Files.writeString(componentCssFile.toPath(), componentStyles,
                    StandardCharsets.UTF_8);
            waitUntil(driver -> componentCssFile.exists());
        } catch (IOException e) {
            throw new RuntimeException(
                    "Failed to apply component styles in " + componentCssFile,
                    e);
        }
    }

    private void deleteCurrentThemeComponentStyles() {
        Assert.assertTrue("Expected theme generated file to be present",
                currentThemeGeneratedFile.exists());
        deleteFile(currentThemeComponentCSSFile);
    }

    private void deleteParentThemeComponentStyles() {
        Assert.assertTrue("Expected parent theme generated file to be present",
                parentThemeGeneratedFile.exists());
        deleteFile(parentThemeComponentCSSFile);
    }

    private void deleteFile(File fileToDelete) {
        if (fileToDelete != null && fileToDelete.exists()
                && !fileToDelete.delete()) {
            Assert.fail("Unable to delete " + fileToDelete);
        }
    }

    private void doActionAndWaitUntilLiveReloadComplete(Runnable action) {
        final String initialAttachId = getAttachIdentifier();
        action.run();
        waitForLiveReload(initialAttachId);
    }

    private String getAttachIdentifier() {
        int attempts = 0;
        while (attempts < 10) {
            try {
                waitForElementPresent(By.id(ATTACH_IDENTIFIER));
                return findElement(By.id(ATTACH_IDENTIFIER)).getText();
            } catch (StaleElementReferenceException
                    | NoSuchElementException e) {
                attempts++;
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Assert.fail(
                        "Test interrupted while waiting for attach identifier");
            }
        }
        Assert.fail("Attach Identifier Element waiting timeout");
        return null;
    }

    private void waitForLiveReload(final String initialAttachId) {
        waitUntilWithMessage(d -> {
            try {
                final String newViewId = getAttachIdentifier();
                return !initialAttachId.equals(newViewId);
            } catch (StaleElementReferenceException e) {
                return false;
            }
        }, "Wait for live reload timeout");
    }

    private void waitUntilWithMessage(ExpectedCondition<?> condition,
            String message) {
        try {
            waitUntil(condition);
        } catch (TimeoutException te) {
            Assert.fail(message);
        }
    }

    private void checkNoFrontendErrors(String theme) {
        getLogEntries(Level.ALL).forEach(logEntry -> {
            if (logEntry.getMessage().contains("Module build failed")) {
                Assert.fail(String.format(
                        "Frontend error detected in the browser console after "
                                + "deleting '%s' component style sheet: %s\n\n",
                        theme, logEntry.getMessage()));
            }
        });

        final By byErrorOverlayClass = By.className("v-system-error");
        try {
            waitForElementNotPresent(byErrorOverlayClass);
        } catch (TimeoutException e) {
            WebElement error = findElement(byErrorOverlayClass);
            Assert.fail(String.format(
                    "Frontend error overlay detected after deleting '%s' "
                            + "component style sheet: %s\n\n",
                    theme, error.getText()));
        }
    }
}
