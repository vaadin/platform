package com.vaadin.platform.react.test.security;

import java.util.Collection;
import java.util.Collections;

import com.vaadin.hilla.Nonnull;

/**
 * User information used in client-side authentication and authorization.
 * To be saved in browsers’ LocalStorage for offline support.
 */
public final class UserInfo {

    @Nonnull
    private final String name;
    @Nonnull
    private final Collection<@Nonnull String> authorities;

    public UserInfo(String name, Collection<String> authorities) {
        this.name = name;
        this.authorities = Collections.unmodifiableCollection(authorities);
    }

    public String getName() {
        return name;
    }

    public Collection<String> getAuthorities() {
        return authorities;
    }

}
