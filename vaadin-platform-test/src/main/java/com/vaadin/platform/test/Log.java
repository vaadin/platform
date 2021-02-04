package com.vaadin.platform.test;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Span;

public class Log extends Div {

    private int nr = 1;
    private Span logMsg = new Span();

    public Log() {
        setWidth("100%");
        setHeight("5em");
        getElement().getStyle().set("overflow", "auto");
        logMsg.setId("log");
        add(logMsg);
    }

    public void log(String message) {
        Div row = new Div();
        row.setText(nr++ + ". " + message);
        getElement().appendChild(row.getElement());
        logMsg.setText(message);
    }

}
