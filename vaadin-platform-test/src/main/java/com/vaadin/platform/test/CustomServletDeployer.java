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
package com.vaadin.platform.test;

import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.ServletRegistration;
import jakarta.servlet.annotation.WebListener;

import com.vaadin.flow.server.Constants;
import com.vaadin.flow.server.VaadinServlet;

@WebListener
public class CustomServletDeployer implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        ServletContext servletContext = sce.getServletContext();
        ServletRegistration.Dynamic devModeRegistration = servletContext
                .addServlet("DevMode" + VaadinServlet.class.getName(),
                        VaadinServlet.class);

        devModeRegistration.setInitParameter(
                Constants.SERVLET_PARAMETER_PRODUCTION_MODE,
                Boolean.FALSE.toString());
        devModeRegistration.setAsyncSupported(true);
        devModeRegistration.addMapping("/*");

        ServletRegistration.Dynamic productionRegistration = servletContext
                .addServlet(VaadinServlet.class.getName(), VaadinServlet.class);

        productionRegistration.setInitParameter(
                Constants.SERVLET_PARAMETER_PRODUCTION_MODE,
                Boolean.TRUE.toString());
        productionRegistration.setAsyncSupported(true);
        productionRegistration.addMapping("/prod-mode/*");

    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
    }

}
