package com.vaadin;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.junit.Assert;
import org.junit.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public class LicenseCheckTest {
    private static final Set<String> whitelist = new HashSet<>();
    static {

        // Vaadin
        whitelist.add("https://vaadin.com/license/cvdl-4.0");
        whitelist.add("http://vaadin.com/license/cvrl-1");

        // Eclipse
        whitelist.add("http://www.eclipse.org/org/documents/edl-v10.php");
        whitelist.add("http://www.eclipse.org/legal/epl-v10.html");
        whitelist.add("http://www.eclipse.org/legal/epl-2.0");
        whitelist.add("https://projects.eclipse.org/license/epl-2.0");
        
        // Mozilla
        whitelist.add("http://www.mozilla.org/MPL/MPL-1.1.html");
        whitelist.add("http://www.mozilla.org/MPL/2.0/index.txt");

        // Apache
        whitelist.add("http://apache.org/licenses/LICENSE-2.0");
        whitelist.add("https://www.apache.org/licenses/LICENSE-2.0");
        whitelist.add("http://www.apache.org/licenses/LICENSE-2.0.txt");
        whitelist.add("http://www.apache.org/licenses/LICENSE-2.0");
        whitelist.add("http://www.apache.org/licenses/LICENSE-2.0.html");
        whitelist.add("https://www.apache.org/licenses/LICENSE-2.0.txt");
        whitelist.add("https://spdx.org/licenses/Apache-2.0#licenseText");
        whitelist.add("https://www.apache.org/licenses/LICENSE-2.0.html");
        whitelist.add("http://repository.jboss.org/licenses/apache-2.0.txt");
        whitelist.add("https://repository.jboss.org/licenses/apache-2.0.txt");
         /*
         * License names used by some projects that define their license to be
         * something like to http://projectdomain.com/license, for which the
         * contents might change without notice
         * for example: the vaadin__vaadin-mobile-drag-drop::1.0.1
         */
        whitelist.add("Apache-2.0");

        // BSD
        whitelist.add("http://www.opensource.org/licenses/bsd-license.php");
        whitelist.add("http://opensource.org/licenses/BSD-2-Clause");
        whitelist.add("http://opensource.org/licenses/BSD-3-Clause");

        // MIT
        whitelist.add("https://opensource.org/licenses/MIT");
        whitelist.add("https://spdx.org/licenses/MIT#licenseText");
        whitelist.add("http://www.opensource.org/licenses/mit-license.php");
        whitelist.add("http://opensource.org/licenses/MIT");
        whitelist.add("https://jsoup.org/license");
        whitelist.add("http://opensource.org/licenses/mit-license");
        whitelist.add("https://spdx.org/licenses/MIT-0.html");

        // Public Domain
        whitelist.add("http://creativecommons.org/publicdomain/zero/1.0/");

        // WTFPL (org.reflections)
        whitelist.add("http://www.wtfpl.net/");

        // gwt, javaee, glassfish
        whitelist.add("http://www.gwtproject.org/terms.html");
        whitelist.add("https://github.com/javaee/javax.annotation/blob/master/LICENSE");
        whitelist.add("https://glassfish.dev.java.net/public/CDDLv1.0.html");
        whitelist.add("https://glassfish.dev.java.net/nonav/public/CDDL+GPL.html");

        // aopalliance:aopalliance
        whitelist.add("Public Domain");
        
        // Universal Permissive License
        whitelist.add("http://opensource.org/licenses/UPL");
        
        // BSD-3-Clause
        whitelist.add("https://asm.ow2.io/license.html");
        
        // GNU General Public License
        whitelist.add("https://projects.eclipse.org/license/secondary-gpl-2.0-cp");

        //CDDL + GPLv2 with classpath exception
        whitelist.add("https://oss.oracle.com/licenses/CDDL+GPL-1.1");
        whitelist.add("https://javaee.github.io/javamail/LICENSE");
        
    }

    private static final List<String> excludeDirs = Arrays.asList(".git", "bower_components", "node", "node_modules",
            "src", "generated-sources", "classes", "test-classes");

    private static class LicenseFileVisitor extends SimpleFileVisitor<Path> {

        private boolean visited;

        @Override
        public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
            if (excludeDirs.stream().anyMatch(dir::endsWith)) {
                return FileVisitResult.SKIP_SUBTREE;
            }

            return super.preVisitDirectory(dir, attrs);
        }

        @Override
        public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
            String path = file.toString();
            if (path.endsWith("licenses.xml")) {
                visited = true;
                checkLicenses(file);
            }
            return super.visitFile(file, attrs);
        }

        private void checkLicenses(Path file) {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            try {
                DocumentBuilder builder = factory.newDocumentBuilder();
                Document doc = builder.parse(new ByteArrayInputStream(Files.readAllBytes(file)));
                NodeList licenses = doc.getElementsByTagName("licenses");
                for (int i = 0; i < licenses.getLength(); i++) {
                    Node license = licenses.item(i);
                    Map<String, List<String>> unsupported = new HashMap<>();
                    if (!checkLicenses(license, unsupported)) {
                        Assert.fail(getErrorMessage(file, unsupported));
                    }
                }
            } catch (ParserConfigurationException | SAXException | IOException exception) {
                Assert.fail("Cannot parse license file " + file);
            }
        }

        private String getErrorMessage(Path file, Map<String, List<String>> unsupportedLicenses) {
            StringBuilder builder = new StringBuilder("File ");
            builder.append(file)
                    .append(" contains the following dependencies with licenses that have not been whitelisted: ");
            unsupportedLicenses.forEach((dependency, licenses) -> builder.append("\n dependency '").append(dependency)
                    .append("' has licenses : ").append(licenses));
            return builder.toString();
        }

        private boolean checkLicenses(Node licenses, Map<String, List<String>> unsupportedLicenses) {
            NodeList children = licenses.getChildNodes();
            List<String> licenseNames = new ArrayList<>();
            boolean hasLicenses = false;

            String groupId = getTagContent(licenses.getParentNode(), "groupId");
            String artifactId = getTagContent(licenses.getParentNode(), "artifactId");
            String dependency = groupId + ":" + artifactId;

            for (int i = 0; i < children.getLength(); i++) {
                Node child = children.item(i);
                if ("license".equals(child.getNodeName())) {
                    hasLicenses = true;
                    handleLicense(unsupportedLicenses, licenseNames, dependency, child);
                }
            }
            return !licenseNames.isEmpty() || !hasLicenses;
        }

        private void handleLicense(Map<String, List<String>> unsupportedLicenses, List<String> licenseNames,
                String dependency, Node child) {
            String name = getTagContent(child, "name");
            String url = getTagContent(child, "url");
            String key = url != null ? url : name != null ? name : null;

            if (key == null) {
                Assert.fail("There is no license info (name or url) por dependency: " + dependency);
            } else if (!whitelist.contains(key)) {
                List<String> licenses = unsupportedLicenses.computeIfAbsent(dependency, k -> new ArrayList<>());
                licenses.add(name + ": " + url);
            } else {
                licenseNames.add(name);
            }
        }

        private String getTagContent(Node node, String tag) {
            NodeList children = node.getChildNodes();
            for (int i = 0; i < children.getLength(); i++) {
                Node child = children.item(i);
                if (tag.equals(child.getNodeName())) {
                    return child.getTextContent();
                }
            }
            return null;
        }

        public boolean visited() {
            return visited;
        }

    }

    @Test
    public void checkLicenses() throws URISyntaxException, IOException {
        URL resource = getClass().getResource("/");
        File classes = new File(resource.toURI());
        File target = classes.getParentFile();
        File project = target.getParentFile();
        File parentProject = project.getParentFile();

        LicenseFileVisitor visitor = new LicenseFileVisitor();
        Files.walkFileTree(parentProject.toPath(), visitor);
        Assert.assertTrue(
                "No license.xml visited, you need to run `mvn license:download-licenses` in the parent folder",
                visitor.visited());
    }
}
