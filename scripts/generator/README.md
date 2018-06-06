Generates `bower.json` for core, `bower.json` for vaadin, Maven BOM and release 
notes from `versions.json`.

## Run

`yarn install && node generate.js --platform=10.0.0.beta42 --versions=versions.json`

Generate Java dependencies with SNAPSHOT version by using `--useSnapshots`.

## Test

`yarn test`