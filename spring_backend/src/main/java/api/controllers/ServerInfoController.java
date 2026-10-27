package api.controllers;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;
import java.util.Map;

/**
 * Info del servidor para descubrimiento (QR + matriz).
 * PermitAll — los frontends deben descubrir antes de loguear.
 */
@RestController
@RequestMapping("/api/v1/server")
@RequiredArgsConstructor
public class ServerInfoController {

    @Value("${server.port:8000}")
    private int serverPort;

    /** IP LAN real, inyectada por el launcher (--app.lan-ip). Si falta, se calcula. */
    @Value("${app.lan-ip:}")
    private String lanIpConfigurada;

    @GetMapping("/info")
    public Map<String, Object> info() {
        String lanIp = resolverLanIp();
        String lanUrl = "http://" + lanIp + ":" + serverPort;
        // Matriz por defecto: 8001-8010, luego 8100-8900 de 100 en 100
        int[] matriz = {8001,8002,8003,8004,8005,8006,8007,8008,8009,8010,8100,8200,8300,8400,8500,8600,8700,8800,8900};
        return Map.of(
                "port", serverPort,
                "lanIp", lanIp,
                "lanUrl", lanUrl,
                "apiBase", lanUrl + "/api/v1",
                "matriz", matriz
        );
    }

    @GetMapping(value = "/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> qr(@RequestParam(defaultValue = "300") int size) {
        try {
            String lanIp = resolverLanIp();
            // IP simulada por defecto para pruebas (192.68.1.2) si lanIp no es alcanzable, se usa igual
            String url = "http://" + lanIp + ":" + serverPort;
            // Si el cliente quiere la IP simulada fija, puede pasar ?url=http://192.68.1.2:8001
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(url, BarcodeFormat.QR_CODE, size, size);
            BufferedImage img = MatrixToImageWriter.toBufferedImage(matrix);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "PNG", baos);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"conectar-saasclinica.png\"")
                    .contentType(MediaType.IMAGE_PNG)
                    .body(baos.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * IP LAN del servidor. Orden de prioridad:
     * 1) {@code app.lan-ip} (la calcula el launcher con Get-IpLan, que elige la
     *    interfaz de la ruta por defecto — la verdadera de la red local);
     * 2) heuristica sobre las interfaces: solo direcciones de red local
     *    (192.168/10./172.16-31), sin loopback, link-local ni CGNAT/Tailscale
     *    (100.64-127.x) y saltando adaptadores virtuales (WSL/Hyper-V/VirtualBox
     *    VMware/Tailscale);
     * 3) 192.68.1.2, la IP simulada de pruebas multi-estacion.
     */
    private String resolverLanIp() {
        if (lanIpConfigurada != null && !lanIpConfigurada.isBlank()) {
            return lanIpConfigurada.trim();
        }
        try {
            Enumeration<NetworkInterface> nifs = NetworkInterface.getNetworkInterfaces();
            while (nifs.hasMoreElements()) {
                NetworkInterface nif = nifs.nextElement();
                try {
                    if (!nif.isUp() || nif.isLoopback()) continue;
                    String nombre = (nif.getDisplayName() + " " + nif.getName()).toLowerCase();
                    if (nombre.contains("vethernet") || nombre.contains("wsl")
                            || nombre.contains("virtualbox") || nombre.contains("vmware")
                            || nombre.contains("hyper-v") || nombre.contains("tailscale")
                            || nombre.contains("loopback")) continue;
                    Enumeration<InetAddress> addrs = nif.getInetAddresses();
                    while (addrs.hasMoreElements()) {
                        InetAddress a = addrs.nextElement();
                        if (!(a instanceof Inet4Address)) continue;
                        if (a.isLoopbackAddress() || a.isLinkLocalAddress() || a.isAnyLocalAddress()) continue;
                        String ip = a.getHostAddress();
                        if (esCgnat(ip)) continue;             // 100.64-127.x (Tailscale/CGNAT)
                        if (esRedLocal(ip)) return ip;
                    }
                } catch (Exception ignored) { /* interfaz rara: se salta */ }
            }
        } catch (Exception ignored) {}
        // Para simulación multi-estación en la misma PC, usa la IP simulada pedida
        return "192.68.1.2";
    }

    private boolean esRedLocal(String ip) {
        return ip.startsWith("192.168.") || ip.startsWith("10.")
                || (ip.startsWith("172.") && esRango172(ip));
    }

    private boolean esRango172(String ip) {
        try {
            int segundo = Integer.parseInt(ip.split("\\.")[1]);
            return segundo >= 16 && segundo <= 31;
        } catch (Exception e) { return false; }
    }

    private boolean esCgnat(String ip) {
        try {
            String[] p = ip.split("\\.");
            int segundo = Integer.parseInt(p[1]);
            return "100".equals(p[0]) && segundo >= 64 && segundo <= 127;
        } catch (Exception e) { return false; }
    }
}
