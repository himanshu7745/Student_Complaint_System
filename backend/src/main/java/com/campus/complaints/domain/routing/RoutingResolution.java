package com.campus.complaints.domain.routing;

import com.campus.complaints.domain.user.UserEntity;
import java.util.List;

public record RoutingResolution(UserEntity owner, List<UserEntity> collaborators, boolean resolved, String reason, RoutingRuleEntity matchedRule) {
    public static RoutingResolution unresolved(String reason) {
        return new RoutingResolution(null, List.of(), false, reason, null);
    }
}
