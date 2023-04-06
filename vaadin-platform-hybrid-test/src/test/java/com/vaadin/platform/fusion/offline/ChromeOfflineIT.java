/**
 * Copyright (C) 2023 Vaadin Ltd
 *
 * This program is available under Vaadin Commercial License and Service Terms.
 *
 * See <https://vaadin.com/commercial-license-and-service-terms> for the full
 * license.
 */
package com.vaadin.platform.fusion.offline;

import java.io.IOException;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.mobile.NetworkConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChromeOfflineIT extends ChromeDeviceTest {

  protected Logger getLogger() {
    return LoggerFactory.getLogger(this.getClass().getSimpleName());
  }

  @Test
  public void offlineRoot_reload_viewReloaded() throws IOException {
      getDriver().get(getRootURL() + "/");
      waitForDevServer();

      // Confirm that app shell is loaded
      Assert.assertNotNull("Should have outlet when loaded online",
              findElement(By.id("outlet")));

      // Confirm that client side view is loaded
      Assert.assertNotNull("Should have <hello-world-ts-view> in DOM when loaded online",
              findElement(By.tagName("hello-world-ts-view")));

      // Print in logger the browser console log
      driver.manage().logs().get(LogType.BROWSER).getAll().stream()
          .forEach(c -> getLogger().warn("Console - {} {}", c.getLevel(), c.getMessage()));

      waitForServiceWorkerReady();

      // Set offline network conditions in ChromeDriver
      setConnectionType(NetworkConnection.ConnectionType.AIRPLANE_MODE);

      try {
          Assert.assertEquals("navigator.onLine should be false", false,
                  executeScript("return navigator.onLine"));

          // Reload the page in offline mode
          executeScript("window.location.reload();");
          waitUntil(webDriver -> ((JavascriptExecutor) driver)
                  .executeScript("return document.readyState")
                  .equals("complete"));

          // Confirm that app shell is loaded
          Assert.assertNotNull("Should have outlet when loaded offline",
                  findElement(By.id("outlet")));

          // Confirm that client side view is loaded
          Assert.assertNotNull("Should have <hello-world-ts-view> in DOM when loaded offline",
                  findElement(By.tagName("hello-world-ts-view")));

          // Confirm that connection lost indicator is visible
          Assert.assertNotNull("Should have outlet when loaded offline",
                  findElement(By.tagName("vaadin-connection-indicator")).getAttribute("offline"));
      } finally {
          // Reset network conditions back
          setConnectionType(NetworkConnection.ConnectionType.ALL);
      }
  }

}
