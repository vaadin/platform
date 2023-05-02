package com.vaadin.prodbundle;

import com.vaadin.flow.component.charts.Chart;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.router.internal.DependencyTrigger;

@Route
@DependencyTrigger(Chart.class)
public class ChartsView extends Div {

    public ChartsView() {
        add(new Chart());
    }
}
