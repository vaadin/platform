#!/usr/bin/env bash

# use platform version  from the root pom.xml
version=`mvn -N help:evaluate -Dexpression=project.version -q -DforceStdout | grep "^[0-9]"`

snapshot=$1

# install npm deps needed for the generator node script
[ ! -d scripts/generator/node_modules ] && (cd scripts/generator && npm install)

# run the generator
cmd="node scripts/generator/generate.js --platform=$version --versions=versions.json $snapshot"
echo Running: "$cmd" >&2
$cmd || exit 1

# copy generated poms to the final place
mkdir -p vaadin-bom
cp scripts/generator/results/vaadin-bom.xml vaadin-bom/pom.xml
mkdir -p hilla-bom
cp scripts/generator/results/hilla-bom.xml hilla-bom/pom.xml
mkdir -p vaadin-spring-bom
cp scripts/generator/results/vaadin-spring-bom.xml vaadin-spring-bom/pom.xml

cp scripts/generator/results/vaadin-maven-plugin-pom.xml vaadin-maven-plugin/pom.xml
cp scripts/generator/results/hilla-maven-plugin-pom.xml hilla-maven-plugin/pom.xml
cp scripts/generator/results/vaadin-gradle-plugin-pom.xml vaadin-gradle-plugin/pom.xml
cp scripts/generator/results/vaadin-gradle-plugin-portal-pom.xml vaadin-gradle-plugin/pom-portal.xml
cp scripts/generator/results/vaadin-platform-servlet-containers-tests-pom.xml vaadin-platform-servlet-containers-tests/pom.xml
cp scripts/generator/results/vaadin-core-versions.json vaadin-core/vaadin-core-versions.json
cp scripts/generator/results/vaadin-versions.json vaadin/vaadin-versions.json
cp scripts/generator/results/hilla-versions.json hilla/hilla-versions.json
cp scripts/generator/results/hilla-react-versions.json hilla-react/hilla-react-versions.json
