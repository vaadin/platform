#!/usr/bin/env bash

pushd `dirname $0`
scriptDir=`pwd`
vaadinShrinkwrapNpmDir="$scriptDir"/tmp.npm.vaadin-shrinkwrap
mkdir "$vaadinShrinkwrapNpmDir"
cp "$scriptDir"/generator/results/vaadin-shrinkwrap-package.json "$vaadinShrinkwrapNpmDir"/package.json

pushd $vaadinShrinkwrapNpmDir
npm install
npm shrinkwrap
cp "$vaadinShrinkwrapNpmDir"/npm-shrinkwrap.json "$scriptDir"/generator/results/npm-shrinkwrap.json
popd
