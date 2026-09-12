Generates `package.json` for core, `package.json` for vaadin, Maven BOM and release
notes from `versions.json`.

## Run

`npm install && node generate.js --platform=10.0.0.beta42 --versions=versions.json`

Generate Java dependencies with SNAPSHOT version by using `--useSnapshots`.

## Npm versions pinned by the jars

Flow reads every json file of `META-INF/VAADIN/versions/` on the classpath, from
whichever jar ships it, so a component integration pins the npm versions of the
packages it ships in its own jar, and `versions.json` does not declare them.

The `package.json` of `@vaadin/vaadin-core` still has to depend on all of the
core packages, so the versions of the packages that are missing from
`versions.json` are read back from the jars of the platform version rather than
declared a second time. The jars are looked up in the `com/vaadin` folder of the
local Maven repository, or below the folder given as `--jars=<folder>`. When
none of them is there, the generator says so and the `package.json` only depends
on what `versions.json` declares.

## Test

`npm test`
