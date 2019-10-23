/*
 * Copyright 2000-2017 Vaadin Ltd.
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

import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.theme.Theme;
import com.vaadin.flow.theme.lumo.Lumo;

@Route("user-statistics")
@Theme(Lumo.class)
public class UserStatisticsView extends VerticalLayout {

    private Log log;

    public UserStatisticsView() {
        log = new Log();
        //for this case, the UI needs at least one Vaadin Component
        Button button = new Button("click me", e -> {
            log.log("button clicked");
        });
        button.setId("button");

        VerticalLayout components = new VerticalLayout();
        add(log);
        add(new HorizontalLayout(components));

        components.add(button);
    }
}
