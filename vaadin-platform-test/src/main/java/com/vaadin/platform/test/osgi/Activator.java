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
package com.vaadin.platform.test.osgi;

import java.util.Hashtable;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.http.HttpService;
import org.osgi.service.http.NamespaceException;
import org.osgi.util.tracker.ServiceTracker;

import com.vaadin.flow.server.Constants;
import com.vaadin.flow.server.VaadinServlet;

public class Activator implements BundleActivator {

    private ServiceTracker<HttpService, HttpService> httpTracker;

    private static class FixedVaadinServlet extends VaadinServlet {
        @Override
        public void init(ServletConfig servletConfig) throws ServletException {
            super.init(servletConfig);

            getService().setClassLoader(getClass().getClassLoader());
        }
    }

    @Override
    public void start(BundleContext context) throws Exception {
        httpTracker = new ServiceTracker<HttpService, HttpService>(context,
                HttpService.class.getName(), null) {
            @Override
            public void removedService(ServiceReference<HttpService> reference,
                    HttpService service) {
                // HTTP service is no longer available, unregister our
                // servlet...
                service.unregister("/*");
                service.unregister("/prod-mode/*");
            }

            @Override
            public HttpService addingService(
                    ServiceReference<HttpService> reference) {
                registerServlet(context, reference, "/*", false);
                return registerServlet(context, reference, "/prod-mode/*",
                        true);
            }
        };
        // start tracking all HTTP services...
        httpTracker.open();
    }

    private HttpService registerServlet(BundleContext context,
            ServiceReference<HttpService> reference, String mapping,
            boolean productionMode) {
        // HTTP service is available, register our servlet...
        HttpService httpService = context.getService(reference);
        Hashtable<String, String> params = new Hashtable<>();
        params.put(Constants.SERVLET_PARAMETER_PRODUCTION_MODE,
                Boolean.toString(productionMode));
        try {
            httpService.registerServlet(mapping, new FixedVaadinServlet(),
                    params, null);
        } catch (ServletException | NamespaceException exception) {
            throw new RuntimeException(exception);
        }
        return httpService;
    }

    @Override
    public void stop(BundleContext context) throws Exception {
        // stop tracking all HTTP services...
        httpTracker.close();
    }
}
