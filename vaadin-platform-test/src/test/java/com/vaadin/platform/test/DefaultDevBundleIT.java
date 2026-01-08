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
package com.vaadin.platform.test;

import java.io.File;

import org.junit.After;
import org.junit.Assert;
import org.junit.Test;

import com.vaadin.flow.internal.FrontendUtils;
import com.vaadin.flow.server.Constants;

public class DefaultDevBundleIT extends AbstractPlatformTest {

    @Test
    public void test() throws Exception {
        File baseDir = new File(System.getProperty("user.dir", "."));
        File devBundle = new File(baseDir, "target/" + Constants.DEV_BUNDLE_LOCATION);
        File nodeModules = new File(baseDir, FrontendUtils.NODE_MODULES);

        // shouldn't create a dev-bundle
        Assert.assertFalse("Error: folder '" + devBundle.getPath() + "' shouldn't exist." + devBundle.getPath(), devBundle.exists());

        // shouldn't run npm install
        Assert.assertFalse("Error: folder '" + nodeModules.getPath() + "' shouldn't exist.", nodeModules.exists());
    }

    @Test
    public void serviceWorkerIsIncludedAndServed() {
        getDriver().get(getRootURL() + "/sw.js");
        String pageSource = getDriver().getPageSource();
        Assert.assertFalse("Service Worker is not served properly",
                pageSource.contains("Error 404 Not Found")
                || pageSource.contains("Could not navigate to"));
    }

    @After
    public void tearDown() throws Exception {
        // close the browser instance when all tests are done
        getDriver().quit();
    }

    @Override
    protected String getTestPath() {
        return "";
    }
}
