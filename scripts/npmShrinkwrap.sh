#!/usr/bin/env bash

pushd `dirname $0`
scriptDir=`pwd`
vaadinShrinkwrapNpmDir="$scriptDir"/tmp.npm.vaadin-shrinkwrap
mkdir "$vaadinShrinkwrapNpmDir"
cp "$scriptDir"/generator/results/vaadin-shrinkwrap-package.json "$vaadinShrinkwrapNpmDir"/package.json

coreShrinkwrapNpmDir="$scriptDir"/tmp.npm.vaadin-core-shrinkwrap
mkdir "$coreShrinkwrapNpmDir"
cp "$scriptDir"/generator/results/vaadin-core-shrinkwrap-package.json "$coreShrinkwrapNpmDir"/package.json

pushd $coreShrinkwrapNpmDir
npm install
npm shrinkwrap
cp "$coreShrinkwrapNpmDir"/npm-shrinkwrap.json "$scriptDir"/generator/results/vaadin-core-npm-shrinkwrap.json
popd

pushd $vaadinShrinkwrapNpmDir
npm install
npm shrinkwrap
cp "$vaadinShrinkwrapNpmDir"/npm-shrinkwrap.json "$scriptDir"/generator/results/vaadin-npm-shrinkwrap.json
popd
