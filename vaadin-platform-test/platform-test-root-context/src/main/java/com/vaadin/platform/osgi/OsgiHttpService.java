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
package com.vaadin.platform.osgi;

import org.osgi.framework.Bundle;
import org.osgi.service.http.HttpContext;
import org.osgi.service.http.HttpService;
import org.osgi.service.http.NamespaceException;

import javax.servlet.Servlet;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRegistration;
import java.util.Collection;
import java.util.Dictionary;

public class OsgiHttpService implements HttpService {

    private final Bundle bundle;

    private final ServletContext servletContext;

    public OsgiHttpService(Bundle bundle, ServletContext servletContext) {
        this.bundle = bundle;
        this.servletContext = servletContext;
    }

    @Override
    public void registerServlet(String alias, Servlet servlet,
            Dictionary initparams, HttpContext context)
            throws ServletException, NamespaceException {

    }

    @Override
    public void registerResources(String alias, String path,
            HttpContext context) throws NamespaceException {
        if (context == null) {
            context = createDefaultHttpContext();
        }

        StaticResourceServlet servlet = (StaticResourceServlet) servletContext
                .getAttribute(OSGiHttpServiceRegistration.RESOURCES_SERVLET);
        servlet.setPath(path);
        servlet.setContext(context);
        ServletRegistration.Dynamic dynamic = (ServletRegistration.Dynamic) servletContext
                .getServletRegistration(
                        OSGiHttpServiceRegistration.RESOURCES_SERVLET);
        Collection<String> mappings = dynamic.getMappings();
        if (mappings.size() != 1
                && !mappings.iterator().next().equals(alias + "/*")) {
            throw new IllegalStateException(
                    "Unexpected alias for resource registration : " + alias
                            + ". The current implemenation registers a servlet for "
                            + "static resources only with '/VAADIN/static/client' alias and assumes "
                            + "that there will be incoming request to register a resource only for this alias. "
                            + "Current implementation should be totaly rewritten to support other aliases");
        }
    }

    @Override
    public void unregister(String alias) {
    }

    @Override
    public HttpContext createDefaultHttpContext() {
        return new HttpContextImpl(bundle);
    }

}
