/*
 * Copyright 2000-2022 Vaadin Ltd.
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

import jakarta.servlet.Servlet;
import jakarta.servlet.ServletConfig;
import jakarta.servlet.ServletException;

import java.util.Hashtable;

import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.http.NamespaceException;
import org.osgi.service.http.whiteboard.HttpWhiteboardConstants;

import com.vaadin.flow.server.InitParameters;
import com.vaadin.flow.server.VaadinServlet;

@Component(immediate = true)
public class Activator {

    private static class FixedVaadinServlet extends VaadinServlet {
        @Override
        public void init(ServletConfig servletConfig) throws ServletException {
            super.init(servletConfig);

            getService().setClassLoader(getClass().getClassLoader());
        }
    }

    @Activate
    void activate() throws NamespaceException {
        BundleContext context = FrameworkUtil.getBundle(Activator.class)
                .getBundleContext();

        context.registerService(Servlet.class, new FixedVaadinServlet(),
                createProperties("/*", false));
        context.registerService(Servlet.class, new FixedVaadinServlet(),
                createProperties("/prod-mode/*", true));
    }

    private Hashtable<String, Object> createProperties(String mapping,
            Boolean isProductionMode) {
        Hashtable<String, Object> properties = new Hashtable<>();
        properties.put(
                HttpWhiteboardConstants.HTTP_WHITEBOARD_CONTEXT_INIT_PARAM_PREFIX
                        + InitParameters.SERVLET_PARAMETER_PRODUCTION_MODE,
                isProductionMode.toString());
        properties.put(
                HttpWhiteboardConstants.HTTP_WHITEBOARD_SERVLET_ASYNC_SUPPORTED,
                true);
        properties.put(HttpWhiteboardConstants.HTTP_WHITEBOARD_SERVLET_PATTERN,
                mapping);
        return properties;
    }

}
