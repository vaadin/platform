#!/usr/bin/env bash
cd scripts/generator && npm install && cd ../../ && node scripts/generator/generate.js --platform=10.0-SNAPSHOT --versions=versions.json "$@"
mkdir -p vaadin-bom
cp scripts/generator/results/vaadin-bom.xml vaadin-bom/pom.xml
