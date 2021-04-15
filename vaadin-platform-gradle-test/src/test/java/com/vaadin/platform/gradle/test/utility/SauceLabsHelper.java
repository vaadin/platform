package com.vaadin.platform.gradle.test.utility;

public class SauceLabsHelper {
    private static final String SAUCE_USERNAME_ENV = "SAUCE_USERNAME";
    private static final String SAUCE_USERNAME_PROP = "sauce.user";
    private static final String SAUCE_ACCESS_KEY_ENV = "SAUCE_ACCESS_KEY";
    private static final String SAUCE_ACCESS_KEY_PROP = "sauce.sauceAccessKey";

    public static boolean isConfiguredForSauceLabs() {
        String user = getSauceUser();
        String accessKey = getSauceAccessKey();
        return user != null && !user.isEmpty() && accessKey != null && !accessKey.isEmpty();
    }

    static String getSauceUser() {
        return getSystemPropertyOrEnv(SAUCE_USERNAME_PROP, SAUCE_USERNAME_ENV);
    }

    static String getSauceAccessKey() {
        return getSystemPropertyOrEnv(SAUCE_ACCESS_KEY_PROP,
                SAUCE_ACCESS_KEY_ENV);
    }

    private static String getSystemPropertyOrEnv(String propertyKey,
            String envName) {
        String env = System.getenv(envName);
        String prop = System.getProperty(propertyKey);
        return (prop != null) ? prop : env;
    }
}
