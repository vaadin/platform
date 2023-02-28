package com.vaadin.platform.test;

import org.junit.Test;

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
        $(NotificationElement.class).waitForFirst();
    }
}
