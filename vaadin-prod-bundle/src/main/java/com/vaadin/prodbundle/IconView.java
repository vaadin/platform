package com.vaadin.prodbundle;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.router.internal.DependencyTrigger;

@Route
@DependencyTrigger(Icon.class)
public class IconView extends Div {

    public IconView() {
        add(new Icon());
    }

}
