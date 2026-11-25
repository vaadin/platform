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
package com.vaadin.platform.reload;

import com.vaadin.flow.component.page.PendingJavaScriptResult;
import com.vaadin.flow.dom.Element;
import com.vaadin.flow.js.JsDefinition;
import com.vaadin.flow.js.JsExpression;
import com.vaadin.flow.js.JsInvokers;

/**
 * Calls into {@code window.benchmark}, defined in {@code benchmark.js}.
 * Declared instead of sent as a string, so that it works in strict Content
 * Security Policy mode.
 */
@JsDefinition
public interface BenchmarkJs extends JsInvokers {

    @JsExpression("window.benchmark.start(); return true;")
    PendingJavaScriptResult start();

    @JsExpression("window.benchmark.measureRender($0);")
    void measureRender(Element trigger);
}
