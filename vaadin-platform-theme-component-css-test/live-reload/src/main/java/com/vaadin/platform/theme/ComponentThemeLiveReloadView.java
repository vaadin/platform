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

import java.util.Random;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.Route;

/**
 * Renders a real {@code vaadin-text-field}. The IT creates/updates/deletes a
 * {@code components/vaadin-text-field.css} in the app and parent themes at
 * runtime and asserts Vite HMR pushes the new shadow-DOM styling on the fly.
 * The attach-identifier span changes on every (re)attach, which the IT uses to
 * detect that a live reload has completed.
 */
@Route("theme-live-reload")
public class ComponentThemeLiveReloadView extends Div {

    public static final String ATTACH_IDENTIFIER = "attach-identifier";
    public static final String THEMED_COMPONENT_ID = "themed-component-id";

    private static final Random random = new Random();

    private final Span attachIdLabel = new Span();

    public ComponentThemeLiveReloadView() {
        TextField testThemedTextField = new TextField();
        testThemedTextField.setId(THEMED_COMPONENT_ID);
        add(testThemedTextField);

        add(new Paragraph("This is a Paragraph to test the applied font"));

        attachIdLabel.setId(ATTACH_IDENTIFIER);
        add(attachIdLabel);
        addAttachListener(
                e -> attachIdLabel.setText(Integer.toString(random.nextInt())));
    }
}
