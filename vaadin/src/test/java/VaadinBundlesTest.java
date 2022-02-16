/*
 *
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

import com.vaadin.flow.component.dependency.NpmPackage;
import org.junit.Assert;
import org.junit.Test;

public class VaadinBundlesTest {

    @Test
    public void hasVaadinBundles() {
        try {
            final Class<?> vaadinBundlesClazz = getClass().getClassLoader().loadClass("com.vaadin.bundles.VaadinBundles");
            final NpmPackage[] npmPackages = vaadinBundlesClazz.getAnnotationsByType(NpmPackage.class);
            Assert.assertEquals(1, npmPackages.length);
            Assert.assertEquals("@vaadin/bundles", npmPackages[0].value());
        } catch (ClassNotFoundException e) {
            Assert.fail("VaadinBundles class not found");
        }
    }

}