package com.campus.complaints.domain.user;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmailIgnoreCase(String email);
    List<UserEntity> findByRoleAndActiveTrue(RoleType role);
    List<UserEntity> findByRoleInAndActiveTrue(List<RoleType> roles);
}
