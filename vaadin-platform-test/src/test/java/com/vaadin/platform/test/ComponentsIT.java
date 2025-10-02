package com.vaadin.platform.test;


import org.junit.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
import com.vaadin.flow.component.ironlist.testbench.IronListElement;
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
import com.vaadin.testbench.IPAddress;
import com.vaadin.testbench.Parameters;
import com.vaadin.testbench.TestBenchElement;
import com.vaadin.testbench.parallel.ParallelTest;


public class ComponentsIT extends ParallelTest {

    private static Logger log = LoggerFactory.getLogger(ComponentsIT.class);
    static String hostName;

    static {
        String sauceUser = System.getProperty("sauce.user");
        String sauceKey = System.getProperty("sauce.sauceAccessKey");
        boolean isSauce = sauceUser != null && !sauceUser.isEmpty() && sauceKey != null
                && !sauceKey.isEmpty();
        String hubHost = System
                .getProperty("com.vaadin.testbench.Parameters.hubHostname");
        boolean isHub = !isSauce && hubHost != null && !hubHost.isEmpty();
        hostName = isHub ? IPAddress.findSiteLocalAddress() : "localhost";

        String browsers = System.getProperty("grid.browsers");
        if (sauceUser != null && !sauceUser.isEmpty()) {
            if (browsers == null || browsers.isEmpty()) {
                //drop safari-9 test, it leads to infrastructure error from saucelabs
                //use safari-17 for now, as latest safari-18 will lead saucelabs 
                //to use macOS 15 which is not supported at the moment
                Parameters.setGridBrowsers("ie11,firefox,safari-17,edge");
            } else {
                Parameters.setGridBrowsers(browsers);
            }
        }

        log.info("Running Tests app-url=http://{}:8080 mode={}", hostName,
                isSauce ? "SAUCE (user:" + sauceUser + " browsers: " + browsers + ")"
                        : isHub ? "HUB (hub-host:" + hubHost + ")"
                                : "LOCAL (chromedriver)");
    }

    @Test
    public void appWorks() throws Exception {
        getDriver().get("http://" + hostName + ":8080/");
        checkCustomElement($(NotificationElement.class).waitForFirst());
        checkCustomElement($(DialogElement.class).first());

        checkCustomElement($(BoardElement.class).first());
        checkCustomElement($(RowElement.class).first());
        checkCustomElement($(ButtonElement.class).first());
        checkCustomElement($(ChartElement.class).first());
        checkCustomElement($(CheckboxElement.class).first());
        checkCustomElement($(ComboBoxElement.class).first());
        checkCustomElement($(DatePickerElement.class).first());
        checkCustomElement($(FormLayoutElement.class).first());
        checkCustomElement($(GridElement.class).first());
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

    private void checkCustomElement(TestBenchElement element) {
        Assert.assertNotNull(element);
        String tagName = element.getTagName().toLowerCase();
        Assert.assertTrue(tagName.contains("-"));
        // Check that the custom element has been registered
        Assert.assertTrue((Boolean) executeScript(
                "return !!window.customElements.get(arguments[0])", tagName));
    }
}
