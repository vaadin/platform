package com.vaadin.prodbundle;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.spreadsheet.Spreadsheet;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.router.internal.DependencyTrigger;

@Route
@DependencyTrigger(Spreadsheet.class)
public class SpreadsheetView extends Div {

    public SpreadsheetView() {
        add(new Spreadsheet());
    }
}
