package com.campus.complaints.domain.admin.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class SettingsDtos {
    private SettingsDtos() {}

    public record RoutingRuleDTO(Long id, String category, String hostel, String building, String ownerRole, Long ownerUserId,
                                 List<String> collaboratorRoles, boolean active) {}
    public record RoutingRuleUpsertRequest(
            @NotBlank String category,
            @Size(max = 200) String hostel,
            @Size(max = 200) String building,
            String ownerRole,
            Long ownerUserId,
            List<String> collaboratorRoles,
            Boolean active
    ) {}

    public record SlaRuleDTO(Long id, String priority, Integer acknowledgeWithinMinutes, Integer resolveWithinMinutes, boolean active) {}
    public record SlaRuleUpsertRequest(
            @NotBlank String priority,
            @NotNull Integer acknowledgeWithinMinutes,
            @NotNull Integer resolveWithinMinutes,
            Boolean active
    ) {}

    public record PredictionThresholdDTO(Double threshold) {}
    public record CategoriesResponse(List<String> categories) {}
}
