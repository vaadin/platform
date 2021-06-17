package com.vaadin.jandex;

import java.io.IOException;
import java.io.InputStream;

import org.jboss.jandex.ClassInfo;
import org.jboss.jandex.DotName;
import org.jboss.jandex.Index;
import org.jboss.jandex.IndexReader;
import org.junit.Assert;
import org.junit.Test;

import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.server.HandlerHelper;

public class JandexSmokeTest {

    @Test
    public void generatedJandex_containsContentFromFlowAndComponents()
            throws IOException {
        try (InputStream jandexStream = JandexSmokeTest.class.getClassLoader()
                .getResourceAsStream("META-INF/jandex.idx")) {
            IndexReader reader = new IndexReader(jandexStream);
            final Index index = reader.read();

            ClassInfo classByName = index.getClassByName(
                    DotName.createSimple(HandlerHelper.class.getName()));
            Assert.assertNotNull("Class from flow-server was not found",
                    classByName);

            classByName = index.getClassByName(
                    DotName.createSimple(VerticalLayout.class.getName()));
            Assert.assertNotNull("Class from a component was not found",
                    classByName);
        }

    }

}
