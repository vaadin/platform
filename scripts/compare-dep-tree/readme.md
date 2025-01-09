Build with `mvn clean compile assembly:single`
Run with `java -jar target\compare-dep-tree-1.0-SNAPSHOT-jar-with-dependencies.jar -oldVersion 14.0.0 -newVersion 24.5.0`

By default the program will compare everything under the `com.vaadin` package for the different versions.

Run `java -jar target\compare-dep-tree-10-SNAPSHOT-jar-with-dependencies.jar` without parameters to get an overview of the parameters.