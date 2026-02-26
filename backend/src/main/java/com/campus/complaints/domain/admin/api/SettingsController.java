package com.campus.complaints.domain.admin.api;

import com.campus.complaints.common.api.ApiResponse;
import com.campus.complaints.domain.settings.SettingsService;
import com.campus.complaints.domain.user.RoleType;
import com.campus.complaints.domain.user.UserAccessService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;
    private final UserAccessService userAccessService;

    private void ensureSuperAdmin() {
        userAccessService.assertAnyRole(RoleType.ROLE_SUPER_ADMIN);
    }

    @GetMapping("/routing-rules")
    public ApiResponse<List<SettingsDtos.RoutingRuleDTO>> listRoutingRules() {
        ensureSuperAdmin();
        return ApiResponse.of(settingsService.listRoutingRules());
    }

    @PostMapping("/routing-rules")
    public ApiResponse<SettingsDtos.RoutingRuleDTO> createRoutingRule(@Valid @RequestBody SettingsDtos.RoutingRuleUpsertRequest request) {
        ensureSuperAdmin();
        return ApiResponse.of(settingsService.createRoutingRule(request));
    }

    @PutMapping("/routing-rules/{id}")
    public ApiResponse<SettingsDtos.RoutingRuleDTO> updateRoutingRule(@PathVariable Long id,
                                                                      @Valid @RequestBody SettingsDtos.RoutingRuleUpsertRequest request) {
        ensureSuperAdmin();
        return ApiResponse.of(settingsService.updateRoutingRule(id, request));
    }

    @DeleteMapping("/routing-rules/{id}")
    public ApiResponse<Void> deleteRoutingRule(@PathVariable Long id) {
        ensureSuperAdmin();
        settingsService.deleteRoutingRule(id);
        return ApiResponse.of(null, "Deleted");
    }

    @GetMapping("/sla-rules")
    public ApiResponse<List<SettingsDtos.SlaRuleDTO>> listSlaRules() {
        ensureSuperAdmin();
        return ApiResponse.of(settingsService.listSlaRules());
    }

    @PostMapping("/sla-rules")
    public ApiResponse<SettingsDtos.SlaRuleDTO> createSlaRule(@Valid @RequestBody SettingsDtos.SlaRuleUpsertRequest request) {
        ensureSuperAdmin();
        return ApiResponse.of(settingsService.createSlaRule(request));
    }

    @PutMapping("/sla-rules/{id}")
    public ApiResponse<SettingsDtos.SlaRuleDTO> updateSlaRule(@PathVariable Long id,
                                                              @Valid @RequestBody SettingsDtos.SlaRuleUpsertRequest request) {
        ensureSuperAdmin();
        return ApiResponse.of(settingsService.updateSlaRule(id, request));
    }

    @DeleteMapping("/sla-rules/{id}")
    public ApiResponse<Void> deleteSlaRule(@PathVariable Long id) {
        ensureSuperAdmin();
        settingsService.deleteSlaRule(id);
        return ApiResponse.of(null, "Deleted");
    }

    @GetMapping("/prediction-threshold")
    public ApiResponse<SettingsDtos.PredictionThresholdDTO> getPredictionThreshold() {
        ensureSuperAdmin();
        return ApiResponse.of(settingsService.getThreshold());
    }

    @PutMapping("/prediction-threshold")
    public ApiResponse<SettingsDtos.PredictionThresholdDTO> updatePredictionThreshold(@Valid @RequestBody SettingsDtos.PredictionThresholdDTO request) {
        ensureSuperAdmin();
        return ApiResponse.of(settingsService.updateThreshold(request));
    }

    @GetMapping("/categories")
    public ApiResponse<SettingsDtos.CategoriesResponse> categories() {
        ensureSuperAdmin();
        return ApiResponse.of(settingsService.categories());
    }
}
