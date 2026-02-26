package com.campus.complaints.domain.user;

import com.campus.complaints.common.exception.ForbiddenException;
import com.campus.complaints.common.exception.NotFoundException;
import com.campus.complaints.domain.complaint.ComplaintAssignmentEntity;
import com.campus.complaints.domain.complaint.ComplaintEntity;
import com.campus.complaints.security.AuthenticatedUser;
import com.campus.complaints.security.SecurityUtils;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class UserAccessService {

    public AuthenticatedUser currentPrincipal() {
        return SecurityUtils.currentUser();
    }

    public boolean isAdminLike(AuthenticatedUser user) {
        return switch (user.getRole()) {
            case ROLE_REVIEWER, ROLE_RESOLVER, ROLE_DEPT_ADMIN, ROLE_SUPER_ADMIN -> true;
            default -> false;
        };
    }

    public boolean isSuperAdmin(AuthenticatedUser user) {
        return user.getRole() == RoleType.ROLE_SUPER_ADMIN;
    }

    public boolean isReviewer(AuthenticatedUser user) {
        return user.getRole() == RoleType.ROLE_REVIEWER || user.getRole() == RoleType.ROLE_SUPER_ADMIN;
    }

    public void assertCanViewComplaint(ComplaintEntity complaint) {
        AuthenticatedUser user = currentPrincipal();
        if (isSuperAdmin(user)) return;
        if (user.getRole() == RoleType.ROLE_USER) {
            if (!complaint.getCreatedBy().getId().equals(user.getId())) {
                throw new ForbiddenException("You cannot view this complaint");
            }
            return;
        }
        if (user.getRole() == RoleType.ROLE_REVIEWER) {
            if (!complaint.isNeedsReview()) {
                throw new ForbiddenException("Reviewer can access complaints in review queue only");
            }
            return;
        }
        boolean assigned = complaint.getAssignments().stream()
                .map(ComplaintAssignmentEntity::getUser)
                .anyMatch(u -> u.getId().equals(user.getId()));
        boolean owner = complaint.getOwnerUser() != null && complaint.getOwnerUser().getId().equals(user.getId());
        boolean sameDepartment = complaint.getOwnerUser() != null && complaint.getOwnerUser().getDepartment().name().equals(user.getDepartment());
        if (!(assigned || owner || sameDepartment)) {
            throw new ForbiddenException("You are not allowed to access this complaint");
        }
    }

    public void assertCanCreateInternalMessage(ComplaintEntity complaint) {
        AuthenticatedUser user = currentPrincipal();
        if (user.getRole() == RoleType.ROLE_USER) {
            throw new ForbiddenException("Internal messages are not allowed");
        }
        assertCanViewComplaint(complaint);
    }

    public UserEntity requireUser(UserRepository repository, Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("User not found: " + id));
    }

    public void assertAnyRole(RoleType... allowed) {
        AuthenticatedUser user = currentPrincipal();
        Set<RoleType> allowedSet = Set.of(allowed);
        if (!allowedSet.contains(user.getRole())) {
            throw new ForbiddenException("Insufficient permissions");
        }
    }
}
