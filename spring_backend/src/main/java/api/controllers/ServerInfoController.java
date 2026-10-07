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
import java.net.InetAddress;
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

    private String resolverLanIp() {
        try {
            // Intenta IP LAN real, fallback a 192.68.1.2 (simulada por defecto para pruebas)
            String ip = InetAddress.getLocalHost().getHostAddress();
            if (ip != null && !ip.startsWith("127.") && !ip.startsWith("169.")) return ip;
        } catch (Exception ignored) {}
        // Para simulación multi-estación en la misma PC, usa la IP simulada pedida
        return "192.68.1.2";
    }
}
