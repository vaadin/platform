package com.vaadin.platform.test;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import com.vaadin.flow.component.accordion.testbench.AccordionElement;
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
import com.vaadin.flow.component.customfield.testbench.CustomFieldElement;
import com.vaadin.flow.component.datepicker.testbench.DatePickerElement;
import com.vaadin.flow.component.details.testbench.DetailsElement;
import com.vaadin.flow.component.dialog.testbench.DialogElement;
import com.vaadin.flow.component.formlayout.testbench.FormLayoutElement;
import com.vaadin.flow.component.grid.testbench.GridElement;
import com.vaadin.flow.component.gridpro.testbench.GridProElement;
import com.vaadin.flow.component.ironlist.testbench.IronListElement;
import com.vaadin.flow.component.login.testbench.LoginFormElement;
import com.vaadin.flow.component.menubar.testbench.MenuBarElement;
import com.vaadin.flow.component.notification.testbench.NotificationElement;
import com.vaadin.flow.component.orderedlayout.testbench.HorizontalLayoutElement;
import com.vaadin.flow.component.orderedlayout.testbench.VerticalLayoutElement;
import com.vaadin.flow.component.progressbar.testbench.ProgressBarElement;
import com.vaadin.flow.component.radiobutton.testbench.RadioButtonGroupElement;
import com.vaadin.flow.component.richtexteditor.testbench.RichTextEditorElement;
import com.vaadin.flow.component.select.testbench.SelectElement;
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
                "firefox,chrome,safari,edge");
    }

    @Before
    public void setUp() {
        getDriver().get("http://localhost:8080/prod-mode/");
    }

    @Test
    public void appWorks() throws Exception {
        checkCustomElement($(NotificationElement.class).waitForFirst());
        checkCustomElement($(BoardElement.class).id("board"));
        checkCustomElement($(RowElement.class).id("row"));
        checkCustomElement($(ButtonElement.class).id("button"));
        checkCustomElement($(ChartElement.class).id("chart"));
        checkCustomElement($(CookieConsentElement.class).id("cookieconsent"));
        checkCustomElement($(AccordionElement.class).id("accordion"));
        checkCustomElement($(AppLayoutElement.class).id("applayout"));
        checkCustomElement($(CrudElement.class).id("crud"));
        checkCustomElement($(GridProElement.class).id("gridpro"));
        checkCustomElement($(RichTextEditorElement.class).id("richtexteditor"));
        checkCustomElement($(CustomFieldElement.class).id("customfield"));
        checkCustomElement($(CheckboxElement.class).id("checkbox"));
        checkCustomElement($("vaadin-checkbox-group").id("checkboxgroup"));
        checkCustomElement($(ComboBoxElement.class).id("combobox"));
        checkCustomElement($(DatePickerElement.class).id("datepicker"));
        checkCustomElement($("vaadin-time-picker").id("timepicker"));
        checkCustomElement($(DetailsElement.class).id("details"));
        checkCustomElement($(FormLayoutElement.class).id("formlayout"));
        checkCustomElement($(GridElement.class).id("grid"));
        checkCustomElement($("iron-icon").first());
        checkCustomElement($(IronListElement.class).id("ironlist"));
        checkCustomElement($("vaadin-list-box").id("listbox"));
        checkCustomElement($(LoginFormElement.class).id("loginform"));
        checkCustomElement($(HorizontalLayoutElement.class).id("horizontallayout"));
        checkCustomElement($(VerticalLayoutElement.class).id("verticallayout"));
        checkCustomElement($(ProgressBarElement.class).id("progressbar"));
        checkCustomElement($(RadioButtonGroupElement.class).id("radiobuttongroup"));
        checkCustomElement($(SplitLayoutElement.class).id("splithorizontal"));
        checkCustomElement($(TabElement.class).first());
        checkCustomElement($(TabsElement.class).id("tabs"));
        checkCustomElement($(PasswordFieldElement.class).id("passwordfield"));
        checkCustomElement($(TextAreaElement.class).id("textarea"));
        checkCustomElement($(TextFieldElement.class).id("textfield"));
        checkCustomElement($(MenuBarElement.class).id("menubar"));
        checkCustomElement($(UploadElement.class).id("upload"));
        checkCustomElement($(SelectElement.class).id("select"));

        $(ButtonElement.class).id("open-dialog").click();
        checkCustomElement($(DialogElement.class).id("dialog"));
        $(ButtonElement.class).id("open-confirm-dialog").click();
        checkCustomElement($(ConfirmDialogElement.class).id("confirmdialog"));

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
