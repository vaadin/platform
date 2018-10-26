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
import org.osgi.framework.ServiceFactory;
import org.osgi.framework.ServiceRegistration;
import org.osgi.service.http.HttpService;

import javax.servlet.ServletContext;

public class OsgiHttpServiceFactory implements ServiceFactory<HttpService> {

    private final ServletContext servletContext;

    public OsgiHttpServiceFactory(ServletContext servletContext) {
        this.servletContext = servletContext;
    }

    @Override
    public HttpService getService(Bundle bundle,
            ServiceRegistration<HttpService> registration) {
        return new OsgiHttpService(bundle, servletContext);
    }

    @Override
    public void ungetService(Bundle bundle,
            ServiceRegistration<HttpService> registration,
            HttpService service) {

    }

}
