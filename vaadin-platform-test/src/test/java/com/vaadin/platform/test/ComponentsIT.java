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
            $(NotificationElement.class).waitForFirst();
        } finally {
            List<LogEntry> logs = driver.manage().logs().get(LogType.BROWSER).getAll();
            for (LogEntry e : logs) {
                System.err.println(e.getMessage());
            }
        }
    }
}
