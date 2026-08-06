package api.dto;

import java.math.BigDecimal;

public record AbonoDto(
        BigDecimal monto,
        String metodo) {
}
