/*
 * Copyright 2000-2020 Vaadin Ltd.
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
package com.vaadin.platform.fusion.offline;

import static org.junit.Assert.assertNotNull;

import java.util.List;
import java.util.Objects;
import java.util.logging.Level;
import java.util.stream.Collectors;

import org.junit.Test;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.logging.LogEntry;
import org.openqa.selenium.logging.LogType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.vaadin.flow.component.login.testbench.LoginOverlayElement;
import com.vaadin.flow.component.notification.testbench.NotificationElement;

public class ComponentsIT extends ChromeDeviceTest {

  protected Logger getLogger() {
    return LoggerFactory.getLogger(this.getClass().getSimpleName());
  }

  @Test
  public void loadComponents() throws Exception {
    getDriver().get(getRootURL() + "/components");

    // There should not be component errors in console
    checkLogsForErrors();
    // Notification opens when loaded
    $(NotificationElement.class).waitForFirst();
    
    // Do something with the view
    WebElement view = $("components-view").first().getWrappedElement();
    getCommandExecutor().executeScript("arguments[0].openLoginOverlay()", view);
    assertNotNull($(LoginOverlayElement.class).waitForFirst());
  }

  private void checkLogsForErrors() {
    getLogEntries(Level.WARNING).forEach(logEntry -> {
      if ((Objects.equals(logEntry.getLevel(), Level.SEVERE) || logEntry.getMessage().contains("404"))) {
        throw new AssertionError(String.format(
            "Received error message in browser log console right after opening the page, message: %s", logEntry));
      } else {
        getLogger().warn("This message in browser log console may be a potential error: '{}'", logEntry);
      }
    });
  }

  private List<LogEntry> getLogEntries(Level level) {
    getCommandExecutor().waitForVaadin();
    return driver.manage().logs().get(LogType.BROWSER).getAll().stream()
        .filter(logEntry -> logEntry.getLevel().intValue() >= level.intValue())
        // exclude the favicon error
        .filter(logEntry -> !logEntry.getMessage().contains("favicon.ico")).collect(Collectors.toList());
  }

}
