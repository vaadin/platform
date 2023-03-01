package com.vaadin.platform.test;

import java.util.List;
import java.util.stream.Collectors;

import org.junit.Test;
import org.openqa.selenium.logging.LogEntry;
import org.openqa.selenium.logging.LogType;

import com.vaadin.flow.component.notification.testbench.NotificationElement;
import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.parallel.SauceLabsIntegration;

public class ComponentsIT extends AbstractPlatformTest {

    static {
        if (SauceLabsIntegration.isConfiguredForSauceLabs()) {
            String browsers = System.getProperty("grid.browsers");
            if (browsers == null || browsers.isEmpty()) {
                Parameters.setGridBrowsers("safari");
            } else {
                Parameters.setGridBrowsers(browsers);
            }
        }
    }

    @Override
    protected String getTestPath() {
        return "/prod-mode/";
    }

    @Test
    public void appWorks() throws Exception {
        try {
            Thread.sleep(3600*1000);
            $(NotificationElement.class).waitForFirst();
        } finally {
            List o = (List) executeScript("return window.Vaadin.ConsoleErrors;");
            if (o != null) {

                for (int i = 0; i < o.size(); i++) {
                    System.err.println("Error " + i + ":");
                    List l = (List) o.get(i);
                    for (int j = 0; j < l.size(); j++) {
                        System.err.println(l.get(j));
                    }
                }
            }
            // List<LogEntry> logs = driver.manage().logs().get(LogType.BROWSER).getAll();
            // for (LogEntry e : logs) {
            // System.err.println(e.getMessage());
            // }
        }
    }
}
