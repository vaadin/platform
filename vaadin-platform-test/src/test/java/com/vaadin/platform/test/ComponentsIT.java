package com.vaadin.platform.test;

import org.junit.Assert;
import org.junit.Test;

import com.vaadin.flow.component.board.testbench.BoardElement;
import com.vaadin.flow.component.board.testbench.RowElement;
import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.charts.testbench.ChartElement;
import com.vaadin.flow.component.checkbox.testbench.CheckboxElement;
import com.vaadin.flow.component.combobox.testbench.ComboBoxElement;
import com.vaadin.flow.component.datepicker.testbench.DatePickerElement;
import com.vaadin.flow.component.dialog.testbench.DialogElement;
import com.vaadin.flow.component.formlayout.testbench.FormLayoutElement;
import com.vaadin.flow.component.grid.testbench.GridElement;
import com.vaadin.flow.component.html.testbench.LabelElement;
import com.vaadin.flow.component.ironlist.testbench.IronListElement;
import com.vaadin.flow.component.notification.testbench.NotificationElement;
import com.vaadin.flow.component.orderedlayout.testbench.HorizontalLayoutElement;
import com.vaadin.flow.component.orderedlayout.testbench.VerticalLayoutElement;
import com.vaadin.flow.component.progressbar.testbench.ProgressBarElement;
import com.vaadin.flow.component.radiobutton.testbench.RadioButtonGroupElement;
import com.vaadin.flow.component.tabs.testbench.TabElement;
import com.vaadin.flow.component.tabs.testbench.TabsElement;
import com.vaadin.flow.component.textfield.testbench.PasswordFieldElement;
import com.vaadin.flow.component.textfield.testbench.TextAreaElement;
import com.vaadin.flow.component.textfield.testbench.TextFieldElement;
import com.vaadin.flow.component.upload.testbench.UploadElement;
import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.parallel.ParallelTest;

public class ComponentsIT extends ParallelTest {

    static {
        Parameters.setGridBrowsers("ie11,firefox,chrome,safari,edge");
    }

    @Test
    public void appWorks() throws Exception {
        getDriver().get("http://localhost:8080/");
        Assert.assertNotNull($(NotificationElement.class).waitForFirst());
        Assert.assertNotNull($(DialogElement.class).first());

        Assert.assertNotNull($(BoardElement.class).first());
        Assert.assertNotNull($(RowElement.class).first());
        Assert.assertNotNull($(ButtonElement.class).first());
        Assert.assertNotNull($(ChartElement.class).first());
        Assert.assertNotNull($(CheckboxElement.class).first());
        Assert.assertNotNull($(ComboBoxElement.class).first());
        Assert.assertNotNull($(DatePickerElement.class).first());
        Assert.assertNotNull($(FormLayoutElement.class).first());
        Assert.assertNotNull($(GridElement.class).first());
        Assert.assertNotNull($(LabelElement.class).first());
        Assert.assertNotNull($(IronListElement.class).first());
        Assert.assertNotNull($(NotificationElement.class).first());
        Assert.assertNotNull($(HorizontalLayoutElement.class).first());
        Assert.assertNotNull($(VerticalLayoutElement.class).first());
        Assert.assertNotNull($(ProgressBarElement.class).first());
        Assert.assertNotNull($(RadioButtonGroupElement.class).first());
        // https://github.com/vaadin/vaadin-components-testbench/issues/28
        Assert.assertNotNull($("vaadin-split-layout").first());
        Assert.assertNotNull($(TabElement.class).first());
        Assert.assertNotNull($(TabsElement.class).first());
        Assert.assertNotNull($(PasswordFieldElement.class).first());
        Assert.assertNotNull($(TextAreaElement.class).first());
        Assert.assertNotNull($(TextFieldElement.class).first());
        Assert.assertNotNull($(UploadElement.class).first());

    }
}
