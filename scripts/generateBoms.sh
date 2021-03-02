#!/usr/bin/env bash

# use platform version  from the root pom.xml
version=`mvn -N help:evaluate -Dexpression=project.version -q -DforceStdout`

snapshot=$1

# install npm deps needed for the generator node script
[ ! -d scripts/generator/node_modules ] && (cd scripts/generator && npm install)

# run the generator
cmd="node scripts/generator/generate.js --platform=$version --versions=versions.json $snapshot"
echo Running: "$cmd"
$cmd || exit 1

# copy generated poms to the final place
mkdir -p vaadin-bom
cp scripts/generator/results/vaadin-bom.xml vaadin-bom/pom.xml
mkdir -p vaadin-spring-bom
cp scripts/generator/results/vaadin-spring-bom.xml vaadin-spring-bom/pom.xml

cp scripts/generator/results/vaadin-maven-plugin-pom.xml vaadin-maven-plugin/pom.xml
