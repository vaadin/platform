/*
 * Copyright 2000-2026 Vaadin Ltd.
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
package com.vaadin.platform.theme;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.router.Route;

/**
 * Renders a real {@code vaadin-horizontal-layout} with three slotted children.
 * Each theme in the parent chain ships a
 * {@code components/vaadin-horizontal-layout.css} that styles one slotted child
 * via {@code ::slotted(:nth-child(N))}; the IT verifies all three colours are
 * applied through the component's shadow DOM in a production build.
 */
@Route("theme-components-css")
public class ThemeComponentsCssView extends Div {

    public ThemeComponentsCssView() {
        HorizontalLayout layout = new HorizontalLayout();
        layout.add(new Div("Specific Theme"));
        layout.add(new Div("Reusable Theme"));
        layout.add(new Div("Other theme"));
        add(layout);
    }
}
