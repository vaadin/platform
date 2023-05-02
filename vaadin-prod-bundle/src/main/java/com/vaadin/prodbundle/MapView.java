package com.vaadin.prodbundle;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.map.Map;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.router.internal.DependencyTrigger;

@Route
@DependencyTrigger(Map.class)
public class MapView extends Div {

    public MapView() {
        add(new Map());
    }
}
