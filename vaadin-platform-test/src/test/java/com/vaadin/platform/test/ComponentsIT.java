package com.vaadin.platform.test;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import com.vaadin.flow.component.applayout.testbench.AppLayoutElement;
import com.vaadin.flow.component.board.testbench.BoardElement;
import com.vaadin.flow.component.board.testbench.RowElement;
import com.vaadin.flow.component.button.testbench.ButtonElement;
import com.vaadin.flow.component.charts.testbench.ChartElement;
import com.vaadin.flow.component.checkbox.testbench.CheckboxElement;
import com.vaadin.flow.component.combobox.testbench.ComboBoxElement;
import com.vaadin.flow.component.confirmdialog.testbench.ConfirmDialogElement;
import com.vaadin.flow.component.cookieconsent.testbench.CookieConsentElement;
import com.vaadin.flow.component.crud.testbench.CrudElement;
import com.vaadin.flow.component.datepicker.testbench.DatePickerElement;
import com.vaadin.flow.component.details.testbench.DetailsElement;
import com.vaadin.flow.component.dialog.testbench.DialogElement;
import com.vaadin.flow.component.formlayout.testbench.FormLayoutElement;
import com.vaadin.flow.component.grid.testbench.GridElement;
import com.vaadin.flow.component.ironlist.testbench.IronListElement;
import com.vaadin.flow.component.login.testbench.LoginFormElement;
import com.vaadin.flow.component.login.testbench.LoginOverlayElement;
import com.vaadin.flow.component.notification.testbench.NotificationElement;
import com.vaadin.flow.component.orderedlayout.testbench.HorizontalLayoutElement;
import com.vaadin.flow.component.orderedlayout.testbench.VerticalLayoutElement;
import com.vaadin.flow.component.progressbar.testbench.ProgressBarElement;
import com.vaadin.flow.component.radiobutton.testbench.RadioButtonGroupElement;
import com.vaadin.flow.component.splitlayout.testbench.SplitLayoutElement;
import com.vaadin.flow.component.tabs.testbench.TabElement;
import com.vaadin.flow.component.tabs.testbench.TabsElement;
import com.vaadin.flow.component.textfield.testbench.PasswordFieldElement;
import com.vaadin.flow.component.textfield.testbench.TextAreaElement;
import com.vaadin.flow.component.textfield.testbench.TextFieldElement;
import com.vaadin.flow.component.upload.testbench.UploadElement;
import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.TestBenchElement;
import com.vaadin.testbench.parallel.ParallelTest;

public class ComponentsIT extends ParallelTest {

    static {
        Parameters.setGridBrowsers(
                "ie11,firefox,chrome,safari-9,safari-10,safari-11,edge");
    }

    @Before
    public void setUp() {
        getDriver().get("http://localhost:8080/prod-mode/");
    }

    @Test
    public void appWorks() throws Exception {
        checkCustomElement($(NotificationElement.class).waitForFirst());
        checkCustomElement($(DialogElement.class).first());

        checkCustomElement($(BoardElement.class).first());
        checkCustomElement($(RowElement.class).first());
        checkCustomElement($(ButtonElement.class).first());
        checkCustomElement($(ChartElement.class).first());
        checkCustomElement($(ConfirmDialogElement.class).first());
        checkCustomElement($(CookieConsentElement.class).first());
        checkCustomElement($(AppLayoutElement.class).first());
        checkCustomElement($(CrudElement.class).first());
        checkCustomElement($(CheckboxElement.class).first());
        checkCustomElement($("vaadin-checkbox-group").first());
        checkCustomElement($(ComboBoxElement.class).first());
        checkCustomElement($(DatePickerElement.class).first());
        checkCustomElement($("vaadin-time-picker").first());
        checkCustomElement($(DetailsElement.class).first());
        checkCustomElement($(FormLayoutElement.class).first());
        checkCustomElement($(GridElement.class).first());
        checkCustomElement($("iron-icon").first());
        checkCustomElement($(IronListElement.class).first());
        checkCustomElement($("vaadin-list-box").first());
        checkCustomElement($(LoginFormElement.class).first());
        checkCustomElement($(HorizontalLayoutElement.class).first());
        checkCustomElement($(VerticalLayoutElement.class).first());
        checkCustomElement($(ProgressBarElement.class).first());
        checkCustomElement($(RadioButtonGroupElement.class).first());
        checkCustomElement($(SplitLayoutElement.class).first());
        checkCustomElement($(TabElement.class).first());
        checkCustomElement($(TabsElement.class).first());
        checkCustomElement($(PasswordFieldElement.class).first());
        checkCustomElement($(TextAreaElement.class).first());
        checkCustomElement($(TextFieldElement.class).first());
        checkCustomElement($(UploadElement.class).first());
    }

    private void checkCustomElement(TestBenchElement element) {
        Assert.assertNotNull(element);
        String tagName = element.getTagName().toLowerCase();
        Assert.assertTrue(tagName.contains("-"));
        // Check that the custom element has been registered
        Assert.assertTrue((Boolean) executeScript(
                "return !!window.customElements.get(arguments[0])", tagName));
    }

}
