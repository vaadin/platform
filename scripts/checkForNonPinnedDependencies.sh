#!/usr/bin/env bash
if mvn dependency:tree | grep "version selected from constraint"
then
    echo "Error: Have found versions that are selected from constraint, pin those so they won't change themselves."
    echo "Run mvn:dependency-tree to see all dependencies, including the ones marked as 'selected from constraint'"
    exit 1
else
    echo "OK: No non-pinned dependencies"
fi
