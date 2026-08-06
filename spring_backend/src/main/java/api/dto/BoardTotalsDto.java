package api.dto;

public record BoardTotalsDto(
        long total,
        long waiting,
        long delayed,
        long done) {
}
