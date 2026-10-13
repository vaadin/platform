Generates the versions files, Maven BOM and release notes from `versions.json`.

## Run

`npm install && node generate.js --platform=10.0.0.beta42 --versions=versions.json`

Generate Java dependencies with SNAPSHOT version by using `--useSnapshots`.

## Npm versions pinned by the jars

Flow reads every json file of `META-INF/VAADIN/versions/` on the classpath, from
whichever jar ships it, so a component integration pins the npm versions of the
packages it ships in its own jar, and `versions.json` does not declare them.

The npm packages `@vaadin/vaadin-core` and `@vaadin/vaadin` are published from
[vaadin/web-components](https://github.com/vaadin/web-components) since 25.4.

## Test

`npm test`
