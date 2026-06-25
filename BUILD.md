# Building the Vaadin platform

## Generate BOMs

For running the project, you need to run the following script before any maven related commands:
```
scripts/generateBoms.sh
```

If you want to use snapshot versions of the platform dependencies run:
```
scripts/generateBoms.sh --useSnapshots
```

## Release process

For releasing a new platform from CI servers the workflow should be:
 1. set the version to release in pom.xml file by running `mvn versions:set -DnewVersion=n.n.n`
 2. generate and update other pom.xml files by running `./scripts/generateBoms.sh` script, if you want to use snapshots run `./scripts/generateBoms.sh --useSnapshots` instead.
 3. package  `mvn package -Pjavadocs -DskipTests`
 4. deploy `mvn deploy -Pproduction,release,javadocs,flatten-pom -DskipTests -DshrinkWrap`
 5. generate release notes `node scripts/generator/generate.js --platform=n.n.n --versions=versions.json`

NOTE: that deploy needs to correctly set the credentials and target maven repo

### Umbrella artifacts: vaadin, vaadin-core and vaadin-ee

The release modules are split across three profiles in the root `pom.xml`:

| Profile | Activation | Modules it adds |
|---------|------------|-----------------|
| `platform` | active by default (disabled with `-DskipPlatform`) | everything except `vaadin`, `vaadin-core`, `vaadin-ee` |
| `oss` | `-Doss` | `vaadin`, `vaadin-core` |
| `ee` | `-Dee` | `vaadin-ee` |

`vaadin-ee` is the Enterprise Edition umbrella. It depends on `vaadin-core-internal` and `vaadin-internal`, so it pulls every component the same way `vaadin` does, and it carries an EE license check.

A release repository does not allow overwriting an already published artifact, so the parent pom (`vaadin-platform-parent`) and the shared modules are deployed only once. A full reactor build deploys the parent pom plus the modules of the active profiles, while a `-pl` build deploys only the listed modules and not the parent. This gives five deploy options:

| # | What gets deployed | Command | Parent pom |
|---|--------------------|---------|------------|
| 1 | everything: `vaadin` + `vaadin-ee` + parent + modules | `mvn deploy -Doss -Dee` | yes (first time) |
| 2 | everything except `vaadin`/`vaadin-core` | `mvn deploy -Dee` | yes (first time) |
| 3 | everything except `vaadin-ee` | `mvn deploy -Doss` | yes (first time) |
| 4 | only `vaadin-ee` (after #3) | `mvn deploy -pl vaadin-ee -Dee` | no (already there) |
| 5 | only `vaadin`/`vaadin-core` (after #2) | `mvn deploy -pl vaadin,vaadin-core -Doss` | no (already there) |

Valid combinations so the parent pom is deployed exactly once: all at once (#1), EE first and OSS later (#2 then #5), or OSS first and EE later (#3 then #4). Combine these with the normal release flags (`-Pproduction,release,javadocs,flatten-pom -DskipTests -DshrinkWrap`).

## Installing in local repo

You can install the platform artifacts in your local maven cache by running the following command.
```
mvn clean install -DskipTests
```

Optionally you might need smoke tests package for running in servlet-containers tests, then you need to run
```
mvn clean install -DskipTests -Pproduction -Pnpm-it
```

To install a single umbrella, for example `vaadin-ee`, build just that module (the rest of the platform at the same version must already be available in the repository):
```
mvn -pl vaadin-ee -Dee clean install -DskipTests
```

## Running tests

There are three modules with Integration Tests, for running each one you need to enable the corresponding profile.

In Addition, tests include Collaboration Engine, you need to provide a [valid license](https://vaadin.com/collaboration#free-users) to run it by setting a maven property e.g:

```
-Dce.license='{"content":{"key":"XXX","owner":"foo","quota":1000000,"endDate":"date"},"checksum":"XXX"}'
```

### Run integration tests in Sauce Labs
1. You need valid Sauce Labs credentials for running the tests
2. For Smoke Integration Tests run:
```
mvn verify -Pproduction,npm-it \
  -Dsa.user=your_username -Dsa.key=your_key \
  -Dce.license=your_ce_license
```
2. For Fusion Integration Tests run:
```
mvn verify -Pproduction,fusion-hybrid \
  -Dsauce.user=your_username -Dsauce.sauceAccessKey=your_key \
  -Dce.license=your_ce_license
```
3. For Servlet Contaner Integration Tests need to run:
```
mvn install -Pproduction,npm-it -DskipTests
mvn verify -Pproduction,npm-it-servlet-containers \
  -Dsauce.user=your_username -Dsauce.sauceAccessKey=your_key \
  -Dce.license=your_ce_license
```
4. For gradle module tests
```
cd vaadin-platform-gradle-test
./gradlew clean build \
  -Pvaadin.productionMode \
  -Dsauce.user=your_username -Dsauce.sauceAccessKey=your_key
```

### Runing tests in selenium hub

1. First you need to install docker in your local computer, and run the selenium standalone container

```
 docker run --name selenium-container -p 4444:4444 -p7900:7900 --rm selenium/standalone-chrome:latest
```

2. Then run the smoke tests in other terminal
```
mvn verify -Pproduction,npm-it \
  -Dce.license=your_ce_license \
  -Dcom.vaadin.testbench.Parameters.hubHostname=localhost \
  -Dcom.vaadin.testbench.Parameters.testsInParallel=1
```
_NOTE:_ when docker container is running you can visit to http://localhost:7900 to see browser output

### Running integration tests in local computer

1. For Flow Integration Tests run:
```
mvn verify -Pproduction,npm-it \
  -Dce.license=your_ce_license \
  -Dcom.vaadin.testbench.Parameters.testsInParallel=1
```
Note that the number of test in parallel can be increased if your computer has enough resources.

2. For Fusion Integration Tests run:
```
mvn verify -Pproduction,fusion-hybrid \
  -Dce.license=your_ce_license
  -Dcom.vaadin.testbench.Parameters.testsInParallel=1
```
3. For Servlet Contaner Integration Tests need to run:

First compile e install smoke tests if not done already:
```
mvn install -DskipTests -Pproduction,npm-it
```

Then run the tests:
```
mvn verify -Pproduction,npm-it-servlet-containers \
  -Dce.license=your_ce_license \
  -Dcom.vaadin.testbench.Parameters.testsInParallel=1
```
4. For running gradle module tests
```
cd vaadin-platform-gradle-test
./gradlew clean build \
  -Pvaadin.productionMode \
  -Dcom.vaadin.testbench.Parameters.testsInParallel=1
```

## Running the test application

### Run test application in dev-mode

When in the `vaadin-platform-test` folder run `mvn jetty:run`, then connect to the `http://localhost:8080` URL.

In the `vaadin-platform-hybrid-test` run `mvn spring-boot:run`, then point your browser to `http://localhost:8080`.

In the `vaadin-platform-gradle-test` run `./gradlew appRun`, then go to `http://localhost:8080`.

