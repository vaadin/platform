package com.vaadin.platform.fusion.cssloader;

import com.vaadin.testbench.parallel.ParallelTest;
import org.junit.Assert;
import org.junit.Test;

public class CssLoaderIT extends ParallelTest {
    public static final int SERVER_PORT = Integer
            .parseInt(System.getProperty("serverPort", "8080"));

    /**
     * Returns the URL to the root of the server, e.g. "http://localhost:8888".
     * 
     * @return the URL to the root
     */
    protected String getRootURL() {
        return "http://" + getDeploymentHostname() + ":" + getDeploymentPort();
    }

    /**
     * Used to determine what port the test is running on.
     * 
     * @return The port the test is running on, by default 8080
     */
    protected int getDeploymentPort() {
        return SERVER_PORT;
    }

    /**
     * Used to determine what URL to initially open for the test.
     * 
     * @return the host name of development server
     */
    protected String getDeploymentHostname() {
        return "localhost";
    }

    @Test
    public void aboutView_should_haveColorDefinedInGloablCssFile() {
        getDriver().get(getRootURL() + "/hello-ts");
        String realColor = executeScript(
            "return window.getComputedStyle("
                + "document.getElementsByTagName('hello-world-ts-view')[0], null)"
                + ".getPropertyValue('color')"
        ).toString();
        // the real color of salmon that is defined in the css file
        String expectedRealColor = "rgb(250, 128, 114)";
        Assert.assertEquals(expectedRealColor, realColor);
    }
}
