package com.campus.complaints.domain.settings;

import com.campus.complaints.common.exception.NotFoundException;
import com.campus.complaints.domain.admin.api.SettingsDtos;
import com.campus.complaints.domain.complaint.ComplaintCategoryType;
import com.campus.complaints.domain.complaint.PriorityLevel;
import com.campus.complaints.domain.routing.RoutingRuleEntity;
import com.campus.complaints.domain.routing.RoutingRuleRepository;
import com.campus.complaints.domain.sla.SlaRuleEntity;
import com.campus.complaints.domain.sla.SlaRuleRepository;
import com.campus.complaints.domain.user.RoleType;
import com.campus.complaints.domain.user.UserEntity;
import com.campus.complaints.domain.user.UserRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final RoutingRuleRepository routingRuleRepository;
    private final SlaRuleRepository slaRuleRepository;
    private final UserRepository userRepository;
    private final PredictionThresholdService thresholdService;

    @Transactional(readOnly = true)
    public List<SettingsDtos.RoutingRuleDTO> listRoutingRules() {
        return routingRuleRepository.findAll().stream().map(this::toRoutingDto).toList();
    }

    @Transactional
    public SettingsDtos.RoutingRuleDTO createRoutingRule(SettingsDtos.RoutingRuleUpsertRequest request) {
        RoutingRuleEntity entity = new RoutingRuleEntity();
        applyRouting(entity, request);
        return toRoutingDto(routingRuleRepository.save(entity));
    }

    @Transactional
    public SettingsDtos.RoutingRuleDTO updateRoutingRule(Long id, SettingsDtos.RoutingRuleUpsertRequest request) {
        RoutingRuleEntity entity = routingRuleRepository.findById(id).orElseThrow(() -> new NotFoundException("Routing rule not found"));
        applyRouting(entity, request);
        return toRoutingDto(routingRuleRepository.save(entity));
    }

    @Transactional
    public void deleteRoutingRule(Long id) {
        routingRuleRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<SettingsDtos.SlaRuleDTO> listSlaRules() {
        return slaRuleRepository.findAll().stream().map(this::toSlaDto).toList();
    }

    @Transactional
    public SettingsDtos.SlaRuleDTO createSlaRule(SettingsDtos.SlaRuleUpsertRequest request) {
        SlaRuleEntity entity = new SlaRuleEntity();
        applySla(entity, request);
        return toSlaDto(slaRuleRepository.save(entity));
    }

    @Transactional
    public SettingsDtos.SlaRuleDTO updateSlaRule(Long id, SettingsDtos.SlaRuleUpsertRequest request) {
        SlaRuleEntity entity = slaRuleRepository.findById(id).orElseThrow(() -> new NotFoundException("SLA rule not found"));
        applySla(entity, request);
        return toSlaDto(slaRuleRepository.save(entity));
    }

    @Transactional
    public void deleteSlaRule(Long id) {
        slaRuleRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public SettingsDtos.PredictionThresholdDTO getThreshold() {
        return new SettingsDtos.PredictionThresholdDTO(thresholdService.getThreshold());
    }

    @Transactional
    public SettingsDtos.PredictionThresholdDTO updateThreshold(SettingsDtos.PredictionThresholdDTO request) {
        return new SettingsDtos.PredictionThresholdDTO(thresholdService.updateThreshold(request.threshold()));
    }

    @Transactional(readOnly = true)
    public SettingsDtos.CategoriesResponse categories() {
        return new SettingsDtos.CategoriesResponse(Arrays.stream(ComplaintCategoryType.values()).map(Enum::name).toList());
    }

    private void applyRouting(RoutingRuleEntity entity, SettingsDtos.RoutingRuleUpsertRequest request) {
        entity.setCategory(ComplaintCategoryType.valueOf(request.category().trim().toUpperCase(Locale.ROOT)));
        entity.setHostelName(trimToNull(request.hostel()));
        entity.setBuildingName(trimToNull(request.building()));
        entity.setOwnerRole(StringUtils.hasText(request.ownerRole()) ? RoleType.valueOf(request.ownerRole().trim().toUpperCase(Locale.ROOT)) : null);
        entity.setOwnerUser(request.ownerUserId() != null ? userRepository.findById(request.ownerUserId()).orElseThrow(() -> new NotFoundException("Owner user not found")) : null);
        entity.setCollaboratorRolesCsv(request.collaboratorRoles() == null ? null : String.join(",", request.collaboratorRoles()));
        entity.setActive(request.active() == null || request.active());
    }

    private void applySla(SlaRuleEntity entity, SettingsDtos.SlaRuleUpsertRequest request) {
        entity.setPriority(PriorityLevel.valueOf(request.priority().trim().toUpperCase(Locale.ROOT)));
        entity.setAcknowledgeWithinMinutes(request.acknowledgeWithinMinutes());
        entity.setResolveWithinMinutes(request.resolveWithinMinutes());
        entity.setActive(request.active() == null || request.active());
    }

    private SettingsDtos.RoutingRuleDTO toRoutingDto(RoutingRuleEntity entity) {
        return new SettingsDtos.RoutingRuleDTO(
                entity.getId(),
                entity.getCategory().name(),
                entity.getHostelName(),
                entity.getBuildingName(),
                entity.getOwnerRole() != null ? entity.getOwnerRole().name() : null,
                entity.getOwnerUser() != null ? entity.getOwnerUser().getId() : null,
                entity.getCollaboratorRolesCsv() == null || entity.getCollaboratorRolesCsv().isBlank() ? List.of() : List.of(entity.getCollaboratorRolesCsv().split(",")),
                entity.isActive()
        );
    }

    private SettingsDtos.SlaRuleDTO toSlaDto(SlaRuleEntity entity) {
        return new SettingsDtos.SlaRuleDTO(entity.getId(), entity.getPriority().name(), entity.getAcknowledgeWithinMinutes(), entity.getResolveWithinMinutes(), entity.isActive());
    }

    private String trimToNull(String v) {
        return StringUtils.hasText(v) ? v.trim() : null;
    }
}
