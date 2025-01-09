package com.vaadin.dircompare;

import java.util.ArrayList;
import java.util.List;

import com.beust.jcommander.Parameter;

public class Arguments {

    public Arguments(){
        excludes.add("com.vaadin.copilot");
    }

    @Parameter(names = {"-oldVersion"}, description = "Version to compare from", required = true)
    public String oldVersion;
    @Parameter(names = {"-newVersion"}, description = "Version to compare against", required = true)
    public String newVersion;
    @Parameter(names = {"-rootDir"}, description = "Root directory to start scanning in - will be the default maven repository if not set", required = false)
    public String rootDir;
    @Parameter(names = {"-failOnMissingClasses"}, description = "Will force the classpath to contain all referenced classes - including ALL third party ones. Not recommended to use.", required = false)
    public boolean failOnMissingClasses = false;
    @Parameter(names={"-exclude"}, description = "List of space-separated java packages that will be ignore during scanning.\n"+
     "Default is 'com.vaadin.copilot' as it is not meant to be used externally. Packages names MUST NOT be wrapped in quotations when given as an argument",
      variableArity = true)
    public List<String> excludes = new ArrayList<>();


}