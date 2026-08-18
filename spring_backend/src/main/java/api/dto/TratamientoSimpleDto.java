package api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TratamientoSimpleDto(
        @JsonProperty("code") String code,
        @JsonProperty("name") String name,
        @JsonProperty("categoryCode") String categoryCode,
        @JsonProperty("category") String category) {
}