/**
 * Copyright (C) 2023 Vaadin Ltd
 *
 * This program is available under Vaadin Commercial License and Service Terms.
 *
 * See <https://vaadin.com/commercial-license-and-service-terms> for the full
 * license.
 */
package com.vaadin.platform.wait;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

import org.junit.Test;

public class WaitHttpIT {

    public static final int SERVER_PORT = Integer
            .parseInt(System.getProperty("serverPort", "8080"));

    @Test
    public void waitForHttp()
            throws MalformedURLException, InterruptedException {
        // This is not really a test.
        // It allows to wait when HTTP container inside OSGi becomes ready.
        // Without this workaround IT tests starts immediately because there is
        // no maven server plugin which runs the server and wait when it becomes
        // ready and then switch to the next maven phase.
        // With the current configuration the server start is done async in the
        // separate JVM and no one waits for its readiness.
        // As a result IT tests starts immediately and this workaround is used
        // to wait when HTTP server starts to handle HTTP requests.
        // It's executed before any other IT test.
        waitRootUrl(60);
    }

    private void waitRootUrl(int count)
            throws MalformedURLException, InterruptedException {
        String viewUrl = "http://localhost:+" + SERVER_PORT + "/";
        if (count == 0) {
            throw new IllegalStateException(
                    "URL '" + viewUrl + "' is not avialable");
        }
        URL url = new URL(viewUrl);
        try {
            url.openConnection().connect();
        } catch (IOException exception) {
            Thread.sleep(1000);
            waitRootUrl(count - 1);
        }
    }

}
