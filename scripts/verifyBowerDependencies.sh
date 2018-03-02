#!/bin/bash

which jq
if [ "$?" != "0" ]
then
	echo "Please install 'jq' to use this script"
	exit 2
fi

vaadinMavenDir=../vaadin
vaadinBowerDir=../../vaadin
vaadinCoreBowerDir=../../vaadin

pushd `dirname $0`
scriptDir=`pwd`

mavenTemp="$scriptDir"/tmp.maven-deps
bowerTemp="$scriptDir"/tmp.bower-deps

pushd "$scriptDir/$vaadinMavenDir"
mvn dependency:tree|grep org.webjars.bowergithub|cut -d: -f2,4 > "$mavenTemp"
mvn dependency:tree|grep com.vaadin.webjar:|cut -d: -f2,4 >> "$mavenTemp"
popd

pushd "$scriptDir/$vaadinCoreBowerDir"
rm -rf bower_components
bower install
bower link
popd

pushd "$scriptDir/$vaadinBowerDir"
rm -rf bower_components
bower link vaadin-core
bower install
for bowerjson in bower_components/*/.bower.json
do 
	cat $bowerjson|jq -r '(.name + ":" + .version)' 
done > "$bowerTemp"

popd
popd

errors=0
for mavenDep in `cat "$mavenTemp"|sort`
do 
	name=`echo $mavenDep|cut -d: -f 1`
	mavenVersion=`echo $mavenDep|cut -d: -f 2`
	bowerVersion=`egrep "^$name:" "$bowerTemp"|cut -d: -f 2`
	if [ "$mavenVersion" != "$bowerVersion" ]
	then
		echo "##teamcity[testStarted name='$name']"
		details="Maven version: $mavenVersion, Bower version: $bowerVersion"
		
		if [[ $name = *"vaadin"* ]]
		then
			echo "##teamcity[testFailed name='$name' type='comparisonFailure' message='Maven and Bower versions do not match' details='$details']"
			errors=1
		else
			echo "##teamcity[testIgnored name='$name' message='Maven and Bower versions do not match\\n$details']"
		fi
		echo "##teamcity[testFinished name='$name']"
		echo 
	fi
done

rm -f "$mavenTemp" "$bowerTemp"


if [ "$errors" != "0" ]
then
	exit 1
fi

