package com.vaadin.platform.react.test.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

import static com.vaadin.flow.spring.security.VaadinSecurityConfigurer.vaadin;

@EnableWebSecurity
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain vaadinSecurityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(registry -> {
            registry.requestMatchers("/", "/images/**").permitAll();
        });
        http.with(vaadin(), vaadin -> vaadin.loginView("/login", "/"));
        return http.build();
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
