package com.vaadin.platform.react.test.security;

import java.util.List;
import java.util.stream.Collectors;

import jakarta.annotation.Nonnull;
import jakarta.annotation.security.PermitAll;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import com.vaadin.hilla.BrowserCallable;

/**
 * Server endpoint that provides information about the current user to the
 * Hilla's client-side authentication.
 */
@BrowserCallable
public class UserInfoService {

    @PermitAll
    @Nonnull
    public UserInfo getUserInfo() {
        Authentication auth = SecurityContextHolder.getContext()
                .getAuthentication();

        final List<String> authorities = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return new UserInfo(auth.getName(), authorities);
    }

}
