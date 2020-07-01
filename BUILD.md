# Building Vaadin Platform

## Generate Boms

For running the project, you need to execute the following script before any maven related commands:
```
scripts/generateBoms.sh
```

## Installing in local repo

You can install the platform artifacts in your local maven cache by running the following command
```
mvn clean install -DskipTests -Dnpm-it=false
````

## Running tests

### Run Smoke Tests in Saucelabs
1. you need valid Saucelabs credentials for running the tests
2. Change to the IT module folder and run:
```
cd vaadin-platform-test
mvn verify -Dsauce.user=your_username -Dsauce.sauceAccessKey=your_key
```

### Run Smoke Tests in local computer

1. Download the chrome driver appropriated for your system. Visit https://chromedriver.chromium.org/downloads 
2. Unzip the file and you will have the `chromedriver` in the current folder
3. Change to the IT module folder and run:

```
cd vaadin-platform-test
mvn verify \
   -Dwebdriver.chrome.driver=../chromedriver \
   -Dcom.vaadin.testbench.Parameters.testsInParallel=1
```
Note that the number of test in parallel can be increased if your computer has enough resources.

4. Optionally you can select which test to run by specifying the test name:
```
mvn verify \
   -Dwebdriver.chrome.driver=../chromedriver \
   -Dcom.vaadin.testbench.Parameters.testsInParallel=1
   -Dit.test=ComponentsIT
```





