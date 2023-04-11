/**
 * Copyright (C) 2023 Vaadin Ltd
 *
 * This program is available under Vaadin Commercial License and Service Terms.
 *
 * See <https://vaadin.com/commercial-license-and-service-terms> for the full
 * license.
 */
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

import org.junit.Assert;
import org.junit.Test;

public class VersionsFileTest {

    @Test
    public void testVersionsFile_existsAsClassPathResource()
            throws IOException {
        File file = new File(
                getClass().getResource("vaadin-core-versions.json").getFile());
        Assert.assertTrue("vaadin-core-versions.json file is missing",
                file.exists() && !file.isDirectory());

        // checking that the file has some content in it
        BufferedReader bufferedReader = new BufferedReader(
                new FileReader(file));
        bufferedReader.readLine();
        String secondLine = bufferedReader.readLine();
        Assert.assertEquals("Unexpected content in file", "    \"core\": {",
                secondLine);
    }
}
