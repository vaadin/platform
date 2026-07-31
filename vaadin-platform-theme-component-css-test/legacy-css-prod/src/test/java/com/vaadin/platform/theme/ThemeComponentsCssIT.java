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

import org.junit.Test;
import org.openqa.selenium.StaleElementReferenceException;

import com.vaadin.testbench.TestBenchElement;

/**
 * Verifies that each theme in the parent chain
 * (specific-theme -> reusable-theme -> other-theme) applies its
 * {@code components/vaadin-horizontal-layout.css} to the real
 * {@code vaadin-horizontal-layout}'s shadow DOM in a production build: the three
 * slotted children end up green / white / red.
 */
public class ThemeComponentsCssIT extends AbstractThemeComponentCssTest {

    private static final String WHITE_COLOR = "rgba(255, 255, 255, 1)";
    private static final String RED_COLOR = "rgba(255, 0, 0, 1)";
    private static final String GREEN_COLOR = "rgba(0, 128, 0, 1)";

    @Test
    public void themeComponentsCSS_stylesApplied() {
        open("/theme-components-css");

        waitUntil(driver -> {
            try {
                TestBenchElement component = $("vaadin-horizontal-layout")
                        .first();
                return GREEN_COLOR.equals(getPartBackgroundColor(component, 0))
                        && WHITE_COLOR
                                .equals(getPartBackgroundColor(component, 1))
                        && RED_COLOR
                                .equals(getPartBackgroundColor(component, 2));
            } catch (StaleElementReferenceException e) {
                return false;
            }
        });
    }

    private static String getPartBackgroundColor(TestBenchElement component,
            int index) {
        return component.$("div").get(index).getCssValue("background-color");
    }
}
