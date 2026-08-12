package api.security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Emisor/validador de JWT HS256 sin dependencias externas.
 * Header y payload van en Base64URL JSON; la firma es HMAC-SHA256 sobre
 * {@code header.payload}. Claims: {@code sub} (codigo de usuario), {@code name},
 * {@code rol}, {@code iat} y {@code exp}.
 */
public final class JwtUtil {

    private static final String HEADER = Base64.getUrlEncoder().withoutPadding()
            .encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    private final byte[] secret;

    public JwtUtil(String secret) {
        if (secret == null || secret.length() < 16) {
            throw new IllegalArgumentException("JWT secret debe tener al menos 16 caracteres");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String create(String subject, String name, String rol, long ttlMillis) {
        long now = Instant.now().getEpochSecond();
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", subject);
        claims.put("name", name);
        claims.put("rol", rol);
        claims.put("iat", now);
        claims.put("exp", now + ttlMillis / 1000);
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(toJson(claims).getBytes(StandardCharsets.UTF_8));
        String signingInput = HEADER + "." + payload;
        return signingInput + "." + sign(signingInput);
    }

    /**
     * @return claims validados (lanza {@link IllegalArgumentException} si la firma
     *         no corresponde o el token expiró).
     */
    public Map<String, Object> parse(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("JWT malformado");
        }
        String signingInput = parts[0] + "." + parts[1];
        String expected = sign(signingInput);
        String actual = parts[2];
        if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Firma JWT inválida");
        }
        byte[] payload = Base64.getUrlDecoder().decode(parts[1]);
        Map<String, Object> claims = parseJson(new String(payload, StandardCharsets.UTF_8));
        long exp = ((Number) claims.get("exp")).longValue();
        if (Instant.now().getEpochSecond() >= exp) {
            throw new IllegalArgumentException("JWT expirado");
        }
        return claims;
    }

    private String sign(String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo firmar JWT", e);
        }
    }

    private static String toJson(Map<String, Object> claims) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : claims.entrySet()) {
            if (!first) {
                sb.append(",");
            }
            first = false;
            sb.append('"').append(e.getKey()).append("\":");
            Object v = e.getValue();
            if (v instanceof Number || v instanceof Boolean) {
                sb.append(v);
            } else {
                sb.append('"').append(v).append('"');
            }
        }
        return sb.append('}').toString();
    }

    private static Map<String, Object> parseJson(String json) {
        Map<String, Object> map = new HashMap<>();
        String body = json.substring(1, json.length() - 1);
        if (body.isEmpty()) {
            return map;
        }
        for (String pair : splitTopLevel(body)) {
            int colon = pair.indexOf(':');
            if (colon < 0) {
                continue;
            }
            String key = pair.substring(0, colon).replace("\"", "").trim();
            String raw = pair.substring(colon + 1).trim();
            map.put(key, raw.startsWith("\"") ? raw.substring(1, raw.length() - 1) : Long.parseLong(raw));
        }
        return map;
    }

    private static java.util.List<String> splitTopLevel(String body) {
        java.util.List<String> parts = new java.util.ArrayList<>();
        int depth = 0;
        int start = 0;
        for (int i = 0; i < body.length(); i++) {
            char c = body.charAt(i);
            if (c == '{' || c == '[') {
                depth++;
            } else if (c == '}' || c == ']') {
                depth--;
            } else if (c == ',' && depth == 0) {
                parts.add(body.substring(start, i));
                start = i + 1;
            }
        }
        parts.add(body.substring(start));
        return parts;
    }
}
