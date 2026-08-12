package api.config;

import api.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Bean del firmador JWT (HS256). Separado de SecurityConfig para no crear un
 * ciclo de dependencias con {@code JwtAuthFilter}.
 */
@Configuration
public class JwtConfig {

    @Bean
    public JwtUtil jwtUtil(@Value("${app.jwt.secret}") String secret) {
        return new JwtUtil(secret);
    }
}
