/*
 * Copyright 2000-2023 Vaadin Ltd.
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
package com.vaadin.devbundle.test;

import java.io.File;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.chrome.ChromeDriver;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.server.Constants;
import com.vaadin.flow.server.frontend.FrontendUtils;
import com.vaadin.testbench.TestBenchTestCase;

public class DefaultDevBundleIT extends TestBenchTestCase {

    @Before
    public void setup() {
        WebDriverManager.chromedriver().setup();
        setDriver(new ChromeDriver());
        getDriver().get("http://localhost:8080/");
        waitUntil(driver0 -> $(ButtonElement.class).waitForFirst() != null);
    }

    @Test
    public void test() {
        File baseDir = new File(System.getProperty("user.dir", "."));
        File devBundle = new File(baseDir, Constants.DEV_BUNDLE_LOCATION);
        File nodeModules = new File(baseDir, FrontendUtils.NODE_MODULES);

        // shouldn't create a dev-bundle
        Assert.assertFalse(devBundle.exists());

        // shouldn't run npm install
        Assert.assertFalse(nodeModules.exists());
    }

    @After
    public void tearDown() throws Exception {
        // close the browser instance when all tests are done
        getDriver().quit();
    }

}
