package com.vaadin.prodbundle;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.pdfviewer.PdfViewer;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.router.internal.DependencyTrigger;

@Route
@DependencyTrigger(PdfViewer.class)
public class PdfViewerView extends Div {

    public PdfViewerView() {
        add(new PdfViewer());
    }
}
