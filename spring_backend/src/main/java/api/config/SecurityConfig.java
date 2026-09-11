package api.config;

import api.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * Seguridad de la API REST + WebSocket.
 *
 * <p>Principio de mínimo privilegio (OWASP A01:2021): deny-by-default.
 * Solo {@code /api/v1/auth/login}, {@code /api/v1/health} y {@code /error}
 * son públicos. Todo lo demás (pacientes/HC-033, usuarios/roles, reportes,
 * configuración, catálogos, dashboard, chat) exige JWT válido.
 * WebSocket handshake en {@code /ws/**} se autentica vía JWT en el
 * STOMP CONNECT (ver WebSocketConfig).
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/v1/auth/login", "/api/v1/health", "/error").permitAll()
                        .requestMatchers("/ws/**").authenticated()
                        // ── RBAC · matriz rol_permiso (JwtAuthFilter carga authorities
                        //    frescas por petición; el front solo refleja, nunca autoriza).
                        // Usuarios / roles / permisos
                        .requestMatchers(HttpMethod.GET, "/api/v1/usuarios/roles/*/permisos",
                                "/api/v1/usuarios/permisos").hasAuthority("PERMISOS_GESTIONAR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/usuarios/roles/*/permisos")
                        .hasAuthority("PERMISOS_GESTIONAR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/usuarios/roles/todos")
                        .hasAuthority("ROLES_GESTIONAR")
                        .requestMatchers(HttpMethod.POST, "/api/v1/usuarios/roles",
                                "/api/v1/usuarios/estados").hasAuthority("ROLES_GESTIONAR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/usuarios/roles/*")
                        .hasAuthority("ROLES_GESTIONAR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/usuarios/roles/*/toggle-status")
                        .hasAuthority("ROLES_GESTIONAR")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/usuarios/roles/*")
                        .hasAuthority("ROLES_GESTIONAR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/usuarios").hasAuthority("USU_VER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/usuarios").hasAuthority("USU_CREAR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/usuarios/*").hasAuthority("USU_EDITAR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/usuarios/*/toggle-status")
                        .hasAuthority("USU_SUSPENDER")
                        // Configuración
                        .requestMatchers(HttpMethod.GET, "/api/v1/configuracion").hasAuthority("CFG_VER")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/configuracion").hasAuthority("CFG_EDITAR")
                        // Agenda (dashboard)
                        .requestMatchers(HttpMethod.GET, "/api/v1/dashboard/**").hasAuthority("AGENDA_VER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/dashboard/**").hasAuthority("AGENDA_GESTIONAR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/dashboard/**").hasAuthority("AGENDA_GESTIONAR")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/dashboard/**").hasAuthority("AGENDA_GESTIONAR")
                        // Pacientes + historia 033
                        .requestMatchers(HttpMethod.GET, "/api/v1/pacientes/*/hclinica/**",
                                "/api/v1/pacientes/*/evolucion").hasAuthority("HC_VER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/pacientes/*/evolucion")
                        .hasAuthority("HC_EDITAR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/pacientes/*/hclinica",
                                "/api/v1/pacientes/*/hclinica/*", "/api/v1/pacientes/*/teeth/*")
                        .hasAuthority("HC_EDITAR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/pacientes/**").hasAuthority("PAC_VER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/pacientes").hasAuthority("PAC_CREAR")
                        .requestMatchers(HttpMethod.POST, "/api/v1/pacientes/*/abonos")
                        .hasAuthority("COBROS_GESTIONAR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/pacientes/*").hasAuthority("PAC_EDITAR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/pacientes/*/abonos")
                        .hasAuthority("COBROS_GESTIONAR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/pacientes/alerts/*")
                        .hasAuthority("PAC_EDITAR")
                        // Tratamientos + categorías
                        .requestMatchers(HttpMethod.GET, "/api/v1/tratamientos/**").hasAuthority("TRA_VER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/tratamientos/**")
                        .hasAuthority("TRA_GESTIONAR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/tratamientos/*")
                        .hasAuthority("TRA_GESTIONAR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/tratamientos/*")
                        .hasAuthority("TRA_GESTIONAR")
                        .requestMatchers(HttpMethod.POST, "/api/v1/categorias",
                                "/api/v1/categorias/*/fusion").hasAuthority("TRA_CATALOGOS")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/categorias/*")
                        .hasAuthority("TRA_CATALOGOS")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/categorias/*/toggle-status")
                        .hasAuthority("TRA_CATALOGOS")
                        .requestMatchers(HttpMethod.GET, "/api/v1/categorias/**").hasAuthority("TRA_VER")
                        // Turnos / consultorios / unidades / ubicaciones
                        .requestMatchers(HttpMethod.GET, "/api/v1/turnos/**").hasAuthority("TUR_VER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/turnos/**").hasAuthority("TUR_GESTIONAR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/turnos/*").hasAuthority("TUR_GESTIONAR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/turnos/*/toggle-status")
                        .hasAuthority("TUR_GESTIONAR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/consultorios/**",
                                "/api/v1/unidades/**", "/api/v1/ubicaciones/**").hasAuthority("CON_VER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/consultorios/**",
                                "/api/v1/unidades/**", "/api/v1/ubicaciones/**").hasAuthority("CON_GESTIONAR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/consultorios/*",
                                "/api/v1/unidades/*", "/api/v1/ubicaciones/*").hasAuthority("CON_GESTIONAR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/consultorios/*/toggle-status",
                                "/api/v1/unidades/*/toggle-status", "/api/v1/ubicaciones/*/toggle-status")
                        .hasAuthority("CON_GESTIONAR")
                        // Clínico
                        .requestMatchers(HttpMethod.GET, "/api/v1/odontologos/**").hasAuthority("ODO_VER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/odontologos/**").hasAuthority("ODO_GESTIONAR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/odontologos/*").hasAuthority("ODO_GESTIONAR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/odontologos/**").hasAuthority("ODO_GESTIONAR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/especialidades/**").hasAuthority("ESP_VER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/especialidades/**")
                        .hasAuthority("ESP_GESTIONAR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/especialidades/*")
                        .hasAuthority("ESP_GESTIONAR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/especialidades/*/toggle-status")
                        .hasAuthority("ESP_GESTIONAR")
                        // Reportes (lectura) + exportación (front exige REP_EXPORTAR)
                        .requestMatchers(HttpMethod.GET, "/api/v1/reportes/**").hasAuthority("REP_VER")
                        // Comunicación
                        .requestMatchers(HttpMethod.GET, "/api/v1/messages/**").hasAuthority("MSG_VER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/messages/**").hasAuthority("MSG_GESTIONAR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/messages/**").hasAuthority("MSG_GESTIONAR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/chat/**").hasAuthority("CHAT_VER")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/chat/conversaciones/*/leer")
                        .hasAuthority("CHAT_VER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/chat/**").hasAuthority("CHAT_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/chat/conversaciones/*/nombre")
                        .hasAuthority("CHAT_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/chat/**").hasAuthority("CHAT_ADMIN")
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write(
                            "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Sesion invalida o expirada\"}");
                }))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.addExposedHeader("Authorization");
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
