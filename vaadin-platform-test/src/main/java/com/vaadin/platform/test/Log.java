package com.vaadin.platform.test;

import com.vaadin.flow.component.html.Div;

public class Log extends Div {

    private int nr = 1;

    public Log() {
        setWidth("100%");
        setHeight("5em");
        getElement().getStyle().set("overflow", "auto");
    }

    public void log(String message) {
        Div row = new Div();
        row.setText(nr++ + ". " + message);
        getElement().insertChild(0, row.getElement());
    }

}
