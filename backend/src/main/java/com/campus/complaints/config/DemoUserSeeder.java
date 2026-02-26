package com.campus.complaints.config;

import com.campus.complaints.domain.user.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DemoUserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedUser("Student User", "student@campus.local", RoleType.ROLE_USER, UserDepartment.GENERAL);
        seedUser("Electrical Supervisor", "electrical@campus.local", RoleType.ROLE_RESOLVER, UserDepartment.ELECTRICAL);
        seedUser("Hostel Warden", "warden@campus.local", RoleType.ROLE_DEPT_ADMIN, UserDepartment.HOSTEL);
        seedUser("Facilities Manager", "facilities@campus.local", RoleType.ROLE_DEPT_ADMIN, UserDepartment.FACILITIES);
        seedUser("IT Support", "itdesk@campus.local", RoleType.ROLE_RESOLVER, UserDepartment.IT);
        seedUser("Security Office", "security@campus.local", RoleType.ROLE_RESOLVER, UserDepartment.SECURITY);
        seedUser("Manual Reviewer", "reviewer@campus.local", RoleType.ROLE_REVIEWER, UserDepartment.GENERAL);
        seedUser("Super Admin", "superadmin@campus.local", RoleType.ROLE_SUPER_ADMIN, UserDepartment.GENERAL);
    }

    private void seedUser(String name, String email, RoleType role, UserDepartment dept) {
        UserEntity user = userRepository.findByEmailIgnoreCase(email).orElseGet(UserEntity::new);
        user.setName(name);
        user.setEmail(email);
        user.setRole(role);
        user.setDepartment(dept);
        user.setActive(true);
        if (user.getPasswordHash() == null || !user.getPasswordHash().startsWith("$2")) {
            user.setPasswordHash(passwordEncoder.encode("Password@123"));
        } else {
            // Keep a known demo password in local/dev environments for easy Postman testing.
            user.setPasswordHash(passwordEncoder.encode("Password@123"));
        }
        userRepository.save(user);
    }
}
