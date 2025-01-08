package com.vaadin.dircompare;

import com.beust.jcommander.Parameter;

public class Arguments {

    @Parameter(names = {"-oldVersion"}, description = "Version to compare from", required = true)
    public String oldVersion;
    @Parameter(names = {"-newVersion"}, description = "Version to compare against", required = true)
    public String newVersion;
    @Parameter(names = {"-rootDir"}, description = "Root directory to start scanning in - will be the default maven repository if not set", required = false)
    public String rootDir;

}