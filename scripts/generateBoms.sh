#!/usr/bin/env bash
cd scripts/generator && npm install && cd ../../ && node scripts/generator/generate.js --platform=14.3-SNAPSHOT --versions=versions.json "$@"
mkdir -p vaadin-bom
cp scripts/generator/results/vaadin-bom.xml vaadin-bom/pom.xml
mkdir -p vaadin-spring-bom
cp scripts/generator/results/vaadin-spring-bom.xml vaadin-spring-bom/pom.xml
