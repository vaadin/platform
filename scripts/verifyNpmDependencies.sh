#!/usr/bin/env bash

pushd `dirname $0`
scriptDir=`pwd`
vaadinCoreNpmDir="$scriptDir"/tmp.npm.vaadin-core
mkdir "$vaadinCoreNpmDir"
cp "$scriptDir"/generator/results/vaadin-core-package.json "$vaadinCoreNpmDir"/package.json


vaadinNpmDir="$scriptDir"/tmp.npm.vaadin
mkdir "$vaadinNpmDir"
cp "$scriptDir"/generator/results/vaadin-package.json "$vaadinNpmDir"/package.json

pushd $vaadinCoreNpmDir
npm install
vaadinCorePackage=`npm pack`
popd

pushd $vaadinNpmDir
sed -i "s~\"@vaadin/vaadin-core\": .*~\"@vaadin/vaadin-core\": \"file:$vaadinCoreNpmDir/$vaadinCorePackage\",~g" package.json
npm install
npm install -g find-duplicate-dependencies
result=`find-duplicate-dependencies`
popd

rm -rf "$vaadinCoreNpmDir" "$vaadinNpmDir"

if [[ ! -z "$result" ]]
then
  echo "$result"
  if [[ "$TRAVIS_EVENT_TYPE" == "" ]]
  then
    exit 1
  fi
fi