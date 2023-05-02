package com.vaadin.prodbundle;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.richtexteditor.RichTextEditor;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.router.internal.DependencyTrigger;

@Route
@DependencyTrigger(RichTextEditor.class)
public class RichTextEditorView extends Div {

    public RichTextEditorView() {
        add(new RichTextEditor());
    }
}
