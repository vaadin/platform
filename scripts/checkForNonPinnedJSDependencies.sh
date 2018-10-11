#!/usr/bin/env bash

vaadinCoreDir=scripts/.temp-vaadin-core
vaadinDir=scripts/.temp-vaadin

rm -rf $vaadinCoreDir
rm -rf $vaadinDir

mkdir $vaadinCoreDir
mkdir $vaadinDir

declare -A pinnedBowerDependencies
declare -A pinnedNpmDependencies
nonPinnedBower=()
nonPinnedNpm=()
verify_pinned_bower_dependencies () {
  bower install
  notPinnedFound=false
  for bowerjson in bower_components/*/.bower.json
  do
      depInstalledName=($(jq -r '(.name)' $bowerjson))
      depInstalledVersion=($(jq -r '(.version)' $bowerjson))
      depDeclared=($(jq -r --arg depInstalledName "$depInstalledName" '(.dependencies[$depInstalledName])' bower.json))
      depInstalled=$depInstalledName'#'$depInstalledVersion
      if [[ $depDeclared && $depInstalled = $depDeclared ]] ; then
        pinnedBowerDependencies["$depInstalledName"]=$depInstalled
      elif [[ ! ${pinnedBowerDependencies["$depInstalledName"]} || ${pinnedBowerDependencies["$depInstalledName"]} != $depInstalled ]] ; then
        nonPinnedBower+=("$depInstalled in $1")
      fi
  done
}

verify_pinned_npm_dependencies () {
  npm install --flat
  notPinnedFound=false
  listOfFiles=$(find node_modules/ -name package.json)
  for packagejson in $listOfFiles
  do
      depInstalledName=($(jq -r '(.name)' $packagejson))
      depInstalledVersion=($(jq -r '(.version)' $packagejson))
      depDeclaredVersion=($(jq -r --arg depInstalledName "$depInstalledName" '(.dependencies[$depInstalledName])' package.json))
      #skip checking if it is vaadin-core package
      if [[ $depInstalledName = "@vaadin/vaadin-core" ]] ; then
        continue
      fi
      if [[ $depDeclaredVersion && $depInstalledVersion = $depDeclaredVersion ]] ; then
        pinnedNpmDependencies["$depInstalledName"]=$depInstalledVersion
      elif [[ ! ${pinnedNpmDependencies["$depInstalledName"]} || ${pinnedNpmDependencies["$depInstalledName"]} != $depInstalledVersion ]] ; then
        requiredBy=($(jq -r '(._requiredBy[])' $packagejson))
        nonPinnedNpm+=("$depInstalledName":"$depInstalledVersion required by $requiredBy in $1")
      fi
  done
}

pushd "$vaadinCoreDir"
cp ../generator/results/vaadin-core-bower.json bower.json
echo "===== Verifying bower dependencies for vaadin/vaadin-core ====="
verify_pinned_bower_dependencies "vaadin/vaadin-core"
bower link
if [[ -e ../generator/results/vaadin-core-package.json ]] ; then
  echo "===== Verifying npm dependencies for vaadin/vaadin-core ====="
  cp ../generator/results/vaadin-core-package.json package.json
  verify_pinned_npm_dependencies "vaadin/vaadin-core"
  vaadinCoreNpmPackage=$(npm pack)
fi
popd

pushd "$vaadinDir"
cp ../generator/results/vaadin-bower.json bower.json
bower link vaadin-core
echo "===== Verifying bower dependencies for vaadin/vaadin ====="
verify_pinned_bower_dependencies "vaadin/vaadin"
if [[ -e ../generator/results/vaadin-package.json ]] ; then
  cp ../generator/results/vaadin-package.json package.json
  npm install "../../$vaadinCoreDir/$vaadinCoreNpmPackage" --save
  echo "===== Verifying npm dependencies for vaadin/vaadin ====="
  verify_pinned_npm_dependencies "vaadin/vaadin"
fi
popd

for bower in "${nonPinnedBower[@]}"
do
  echo "Non pinned bower package: " $bower
done

for npm in "${nonPinnedNpm[@]}"
do
  echo "Non pinned npm package: " $npm
done

if [[ -n $nonPinnedBower || -n $nonPinnedNpm ]] ; then
  echo "Please either pin the dependencies or resolve the dependencies conflict"
  exit 1
fi