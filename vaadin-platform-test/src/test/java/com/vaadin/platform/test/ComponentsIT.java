package com.vaadin.platform.test;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.internal.WrapsElement;
import org.openqa.selenium.remote.LocalFileDetector;
import org.openqa.selenium.remote.RemoteWebElement;

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
import com.vaadin.flow.component.dialog.testbench.DialogElement;
import com.vaadin.flow.component.formlayout.testbench.FormLayoutElement;
import com.vaadin.flow.component.grid.testbench.GridElement;
import com.vaadin.flow.component.ironlist.testbench.IronListElement;
import com.vaadin.flow.component.notification.testbench.NotificationElement;
import com.vaadin.flow.component.orderedlayout.testbench.HorizontalLayoutElement;
import com.vaadin.flow.component.orderedlayout.testbench.VerticalLayoutElement;
import com.vaadin.flow.component.progressbar.testbench.ProgressBarElement;
import com.vaadin.flow.component.radiobutton.testbench.RadioButtonElement;
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
                "ie11,firefox,chrome,safari-9,safari-10,safari,edge");
    }

    @Before
    public void setUp() {
        getDriver().get("http://localhost:8080/");
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
        checkCustomElement($(FormLayoutElement.class).first());
        checkCustomElement($(GridElement.class).first());
        checkCustomElement($("iron-icon").first());
        checkCustomElement($(IronListElement.class).first());
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

    @Test
    public void buttonIsRenderedAndRecievesClicks() {
        ButtonElement button = $(ButtonElement.class).first();

        TestBenchElement htmlButton = button.$(TestBenchElement.class)
                .id("button");
        assertElementRendered(htmlButton);

        button.click();

        assertLog("Clicked button");
    }

    @Test
    public void checkboxIsRenderedAndRecievesValueChangeEvent() {
        CheckboxElement checkbox = $(CheckboxElement.class).first();

        TestBenchElement htmlButton = checkbox.$("input")
                .attribute("type", "checkbox").first();
        assertElementRendered(htmlButton);

        checkbox.click();

        assertLog("Checkbox value changed from 'false' to 'true'");
    }

    @Test
    public void checkboxGroupIsRenderedAndRecievesValueChangeEvent() {
        TestBenchElement checkboxGroup = $("vaadin-checkbox-group").first();

        TestBenchElement groupField = checkboxGroup.$("div")
                .attribute("part", "group-field").first();
        assertElementRendered(groupField);

        checkboxGroup.$(CheckboxElement.class).first().click();

        assertLog("CheckboxGroup value changed from '' to 'foo'");
    }

    @Test
    public void comboboxIsRenderedAndRecievesValueChangeEvent() {
        ComboBoxElement comboBox = $(ComboBoxElement.class).first();

        TextFieldElement textField = comboBox.$(TextFieldElement.class)
                .id("input");
        assertElementRendered(textField);

        comboBox.$(TestBenchElement.class).id("toggleButton").click();

        WebElement dropDown = $("vaadin-combo-box-overlay").id("overlay");

        assertElementRendered(dropDown);

        getCommandExecutor().executeScript("arguments[0].value='1'", comboBox);

        assertLog("ComboBox value changed from 'null' to 'First'");
    }

    @Test
    public void datePickerIsRenderedAndRecievesValueChangeEvent() {
        DatePickerElement datePicker = $(DatePickerElement.class).first();

        TextFieldElement textField = datePicker.$(TextFieldElement.class)
                .id("input");
        assertElementRendered(textField);

        datePicker.$("div").attribute("part", "toggle-button").first().click();

        WebElement dropDown = $("vaadin-date-picker-overlay").id("overlay");

        assertElementRendered(dropDown);

        getCommandExecutor().executeScript("arguments[0].value='2018-12-04'",
                datePicker);

        assertLog("DatePicker value changed from null to 2018-12-04");
    }

    @Test
    public void timePickerIsRenderedAndRecievesValueChangeEvent() {
        TestBenchElement timePicker = $("vaadin-time-picker").first();

        TestBenchElement textField = timePicker
                .$("vaadin-time-picker-text-field").first();
        assertElementRendered(textField);

        timePicker.$("span").attribute("part", "toggle-button").first().click();

        WebElement dropDown = $("vaadin-combo-box-overlay").id("overlay");

        assertElementRendered(dropDown);

        getCommandExecutor().executeScript("arguments[0].value='01:37'",
                timePicker);

        assertLog("TimePicker value changed from null to 01:37");
    }

    @Test
    public void gridIsRenderedAndRecievesSelectionEvents() {
        GridElement grid = $(GridElement.class).first();

        assertElementRendered(grid);

        TestBenchElement table = grid.$("table").id("table");

        assertElementRendered(table);

        Assert.assertEquals("Some", grid.getCell(0, 0).getText());
        Assert.assertEquals("Data", grid.getCell(0, 1).getText());

        Assert.assertEquals("Second", grid.getCell(1, 0).getText());
        Assert.assertEquals("Row", grid.getCell(1, 1).getText());

        grid.select(0);

        assertLog("Grid selection changed to 'Optional[{bar=Data, foo=Some}]'");
    }

    @Test
    public void iconsAreRendered() {
        TestBenchElement hIcon = $("iron-icon").first();
        TestBenchElement vIcon = $("iron-icon").get(1);

        assertElementRendered(hIcon);
        assertElementRendered(vIcon);

        TestBenchElement svg = hIcon.$("svg").first();
        assertElementRendered(svg);

        svg = vIcon.$("svg").first();
        assertElementRendered(svg);
    }

    @Test
    public void ironListIsRendered() {
        IronListElement ironList = $(IronListElement.class).first();

        TestBenchElement itemsContainer = ironList.$("div").id("items");
        assertElementRendered(itemsContainer);

        List<TestBenchElement> items = ironList.$("span").all();
        Assert.assertEquals(3, items.size());
        items.stream().forEach(this::assertElementRendered);

        for (int i = 0; i < items.size(); i++) {
            Assert.assertEquals("Item " + i, items.get(i).getText());
        }
    }

    @Test
    public void progressBarIsRendered() {
        ProgressBarElement ironList = $(ProgressBarElement.class).first();

        TestBenchElement bar = ironList.$("div").attribute("part", "bar")
                .first();
        assertElementRendered(bar);

        TestBenchElement value = bar.$("div").attribute("part", "value")
                .first();

        assertElementRendered(value);

        Assert.assertTrue(
                value.getSize().getWidth() < bar.getSize().getWidth());
    }

    @Test
    public void radioButtonGroupIsRenderedAndRecievesValueChangeEvents() {
        RadioButtonGroupElement radioButtonGroup = $(
                RadioButtonGroupElement.class).first();

        TestBenchElement groupField = radioButtonGroup.$("div")
                .attribute("part", "group-field").first();
        assertElementRendered(groupField);

        List<RadioButtonElement> radioButtons = radioButtonGroup
                .$(RadioButtonElement.class).all();
        Assert.assertEquals(5, radioButtons.size());

        radioButtons.stream().forEach(this::assertElementRendered);

        for (int i = 0; i < 5; i++) {
            Assert.assertEquals("Item " + i, radioButtons.get(i).getText());
        }

        radioButtons.get(0).click();

        assertLog("RadioButtonGroup value changed from null to Item 0");
    }

    @Test
    public void textFieldIsRenderedAndRecievesValueChangeEvents() {
        assertTextComponent($(TextFieldElement.class).first(), "input",
                "TextField value changed from to foo");
    }

    @Test
    public void passwordFieldIsRenderedAndRecievesValueChangeEvents() {
        assertTextComponent($(PasswordFieldElement.class).first(), "input",
                "PasswordField value changed from to foo");
    }

    @Test
    public void textAreaIsRenderedAndRecievesValueChangeEvents() {
        assertTextComponent($(TextAreaElement.class).first(), "textarea",
                "TextArea value changed from to foo");
    }

    @Test
    public void uploadIsRenderedAndUploadFile() throws IOException {
        UploadElement upload = $(UploadElement.class).first();

        ButtonElement uploadButton = upload.$(ButtonElement.class).first();
        assertElementRendered(uploadButton);

        TestBenchElement dropLabel = upload.$(TestBenchElement.class)
                .id("dropLabelContainer");

        Assert.assertEquals("Drop file here", dropLabel.getText());

        File tempFile = createTempFile();
        fillPathToUploadInput(tempFile.getPath());

        assertLog("Upload received file text/plain with text foo");
    }

    private void assertTextComponent(TestBenchElement element,
            String mainhtmlTag, String msg) {
        TestBenchElement input = element.$(mainhtmlTag)
                .attribute("part", "value").first();

        assertElementRendered(input);

        getCommandExecutor().executeScript("arguments[0].value='foo'", element);

        assertLog(msg);
    }

    private void assertLog(String msg) {
        WebElement log = findElement(By.id("log"));
        Assert.assertEquals(msg, log.getText());
    }

    private void assertElementRendered(WebElement element) {
        Assert.assertTrue(element.getSize().getHeight() > 0);
        Assert.assertTrue(element.getSize().getWidth() > 0);
    }

    private void checkCustomElement(TestBenchElement element) {
        Assert.assertNotNull(element);
        String tagName = element.getTagName().toLowerCase();
        Assert.assertTrue(tagName.contains("-"));
        // Check that the custom element has been registered
        Assert.assertTrue((Boolean) executeScript(
                "return !!window.customElements.get(arguments[0])", tagName));
    }

    private File createTempFile() throws IOException {
        File tempFile = File.createTempFile("TestFileUpload", ".txt");
        BufferedWriter writer = new BufferedWriter(new FileWriter(tempFile));
        writer.write("foo");
        writer.close();
        tempFile.deleteOnExit();
        return tempFile;
    }

    private void fillPathToUploadInput(String tempFileName) {
        // create a valid path in upload input element. Instead of selecting a
        // file by some file browsing dialog, we use the local path directly.
        WebElement input = $(UploadElement.class).first()
                .$(TestBenchElement.class).id("fileInput");
        setLocalFileDetector(input);
        input.sendKeys(tempFileName);
    }

    private void setLocalFileDetector(WebElement element) {
        if (getRunLocallyBrowser() != null) {
            return;
        }

        if (element instanceof WrapsElement) {
            element = ((WrapsElement) element).getWrappedElement();
        }
        if (element instanceof RemoteWebElement) {
            ((RemoteWebElement) element)
                    .setFileDetector(new LocalFileDetector());
        } else {
            throw new IllegalArgumentException(
                    "Expected argument of type RemoteWebElement, received "
                            + element.getClass().getName());
        }
    }

}
