package com.campus.complaints.domain.routing;

import com.campus.complaints.domain.complaint.ComplaintCategoryType;
import com.campus.complaints.domain.user.RoleType;
import com.campus.complaints.domain.user.UserEntity;
import com.campus.complaints.domain.user.UserRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class RoutingService {

    private final RoutingRuleRepository routingRuleRepository;
    private final UserRepository userRepository;

    public RoutingResolution resolve(ComplaintCategoryType primaryCategory, String hostel, String building) {
        if (primaryCategory == null) return RoutingResolution.unresolved("Primary category missing");
        List<RoutingRuleEntity> rules = routingRuleRepository.findByCategoryAndActiveTrue(primaryCategory);
        rules.sort(Comparator.comparingInt((RoutingRuleEntity r) -> specificity(r, hostel, building)).reversed());
        for (RoutingRuleEntity rule : rules) {
            if (!matches(rule.getHostelName(), hostel)) continue;
            if (!matches(rule.getBuildingName(), building)) continue;

            UserEntity owner = rule.getOwnerUser();
            if (owner == null && rule.getOwnerRole() != null) {
                owner = userRepository.findByRoleAndActiveTrue(rule.getOwnerRole()).stream().findFirst().orElse(null);
            }
            if (owner == null) continue;

            List<UserEntity> collaborators = new ArrayList<>();
            if (StringUtils.hasText(rule.getCollaboratorRolesCsv())) {
                for (String roleValue : rule.getCollaboratorRolesCsv().split(",")) {
                    String normalized = roleValue.trim();
                    if (!StringUtils.hasText(normalized)) continue;
                    RoleType role = RoleType.valueOf(normalized.toUpperCase());
                    collaborators.addAll(userRepository.findByRoleAndActiveTrue(role));
                }
            }
            UserEntity resolvedOwner = owner;
            collaborators = collaborators.stream().filter(u -> !u.getId().equals(resolvedOwner.getId())).distinct().toList();
            return new RoutingResolution(resolvedOwner, collaborators, true, "Matched routing rule " + rule.getId(), rule);
        }
        return RoutingResolution.unresolved("No routing rule matched");
    }

    private boolean matches(String expected, String actual) {
        if (!StringUtils.hasText(expected)) return true;
        if (!StringUtils.hasText(actual)) return false;
        return expected.trim().toLowerCase(Locale.ROOT).equals(actual.trim().toLowerCase(Locale.ROOT));
    }

    private int specificity(RoutingRuleEntity rule, String hostel, String building) {
        int score = 0;
        if (StringUtils.hasText(rule.getHostelName()) && matches(rule.getHostelName(), hostel)) score += 10;
        if (StringUtils.hasText(rule.getBuildingName()) && matches(rule.getBuildingName(), building)) score += 20;
        return score;
    }
}
