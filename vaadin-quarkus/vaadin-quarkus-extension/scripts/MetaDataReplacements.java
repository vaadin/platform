import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class MetaDataReplacements {

    public static void main(String[] args) {
        if (args.length < 3) {
            System.err.println("Usage: MetaDataReplacements <metadata-file> <platform-version> <vaadin-quarkus-version>");
            System.exit(1);
        }

        Path yamlFile = new File(args[0]).toPath();
        if (!Files.exists(yamlFile)) {
            System.err.println("Metadata YAML template file not found at: " + yamlFile);
            System.exit(1);
        }

        String platformVersion = args[1];
        if (platformVersion.isBlank()) {
            System.err.println("Vaadin platform version cannot be blank");
            System.exit(1);
        }
        String vaadinQuarkusVersion = args[2];
        if (vaadinQuarkusVersion.isBlank()) {
            System.err.println("vaadin-quarkus version cannot be blank");
            System.exit(1);
        }

        System.out.println("Updating Vaadin Quarkus extension metadata template at " + yamlFile);
        System.out.println("Platform Version: " + platformVersion);
        System.out.println("Vaadin Quarkus Version: " + vaadinQuarkusVersion);


        try {
            String content = Files.readString(yamlFile);

            content = content.replace("com.vaadin:vaadin-quarkus::jar:" + vaadinQuarkusVersion,
                    "com.vaadin:vaadin-quarkus-extension::jar:" + platformVersion);
            content = content.replace("com.vaadin:vaadin-quarkus:codestarts:jar:" + vaadinQuarkusVersion,
                    "com.vaadin:vaadin-quarkus-extension:codestarts:jar:" + platformVersion);
            content = content.replace("unlisted: \"true\"", "unlisted: \"false\"");

            Files.writeString(yamlFile, content);
            System.out.println("Successfully updated YAML file at: " + yamlFile);

        } catch (IOException e) {
            System.err.println("Error processing YAML file: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
