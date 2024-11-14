#!/usr/bin/env bash

# script requires jq (sudo apt install jq) for processing JSON files
if ! command -v jq 2>&1 >/dev/null
then
    echo "'jq' could not be found. Please install it."
    exit 1
fi

cd vaadin-core-sbom
mvn -ntp -B org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom -q -T 1C
# create file with the licenses that have been found
# since projects differ the actual license is listed either in components>licenses>license>id or components>licenses>license>id in the JSON file 
cat target/bom.json | jq '.components[].licenses[].license | select(.id != null) | .id' > target/found_licenses.txt #overwrite older version if exists
# add the ones listed under the 'name' attribute
cat target/bom.json | jq '.components[].licenses[].license | select(.name != null) | .name' >> target/found_licenses.txt
sort -u target/found_licenses.txt > target/found_licenses_sorted.txt

grep -Fvf ../scripts/data/approved-licenses.txt target/found_licenses_sorted.txt > target/unknown_licenses.txt

if [ -s target/unknown_licenses.txt ]; then 
     echo "Found unknown licenses: "; 
     cat target/unknown_licenses.txt;
     exit 1;
else echo "No unknown licenses found";
    exit 0; 
fi
