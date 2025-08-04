package com.vaadin.platform.react.test.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

import com.vaadin.flow.spring.security.VaadinWebSecurity;
import com.vaadin.hilla.route.RouteUtil;

@EnableWebSecurity
@Configuration
public class SecurityConfig extends VaadinWebSecurity {
    private final RouteUtil routeUtil;

    public SecurityConfig(RouteUtil routeUtil) {
        this.routeUtil = routeUtil;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(registry -> {
            registry.requestMatchers(PathPatternRequestMatcher.pathPattern("/")).permitAll();
            registry.requestMatchers(routeUtil::isRouteAllowed).permitAll();
        });
        super.configure(http);
        setLoginView(http, "/login", "/");
    }

    @Override
    protected void configure(WebSecurity web) throws Exception {
        super.configure(web);
        web.ignoring().requestMatchers(PathPatternRequestMatcher.pathPattern("/images/**"));
    }

    @Bean
    public UserDetailsService users() {
        UserDetails user = User.builder()
                .username("user")
                .password("{noop}user")
                .roles(Role.USER)
                .build();
        UserDetails admin = User.builder()
                .username("admin")
                .password("{noop}admin")
                .roles(Role.ADMIN)
                .build();
        return new InMemoryUserDetailsManager(user, admin);
    }
}
