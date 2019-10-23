/*
 * Copyright 2000-2018 Vaadin Ltd.
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

import java.util.Collections;
import java.util.List;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.DesiredCapabilities;

import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.testbench.annotations.BrowserConfiguration;
import com.vaadin.testbench.parallel.Browser;
import com.vaadin.testbench.parallel.ParallelTest;

public class ChromeUserStatisticsIT extends ParallelTest {

    @Before
    public void setUp() {
        getDriver().get("http://localhost:8080/user-statistics/");
    }

    @Test
    public void BrowserConsoleLogCorrectInfo() throws InterruptedException {
        ButtonElement button = $(ButtonElement.class).id("print");

        Thread.sleep(10000);
        button.click();
        assertLog("Print button clicked");
        assertLogEntries();
    }

    private void assertLogEntries() {
        String item = new LocalStorage(driver).getItemFromLocalStorage("vaadin.statistics.basket");

        Assert.assertTrue("Under production mode, the local storage should be empty", (item == null || item.length()==0));
    }

    @BrowserConfiguration
    public List<DesiredCapabilities> getBrowserConfiguration() {
        return Collections
                .singletonList(Browser.CHROME.getDesiredCapabilities());
    }

    private void assertLog(String msg) {
        WebElement log = findElement(By.id("log"));
        Assert.assertEquals(msg, log.getText());
    }
}
