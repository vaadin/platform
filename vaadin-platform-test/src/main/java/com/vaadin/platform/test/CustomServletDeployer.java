/**
 * Copyright (C) 2023 Vaadin Ltd
 *
 * This program is available under Vaadin Commercial License and Service Terms.
 *
 * See <https://vaadin.com/commercial-license-and-service-terms> for the full
 * license.
 */
package com.vaadin.platform.test;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.ServletRegistration;
import javax.servlet.annotation.WebListener;

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
