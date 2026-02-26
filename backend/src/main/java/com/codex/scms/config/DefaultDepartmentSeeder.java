package com.codex.scms.config;

import com.codex.scms.domain.entity.Department;
import com.codex.scms.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DefaultDepartmentSeeder implements ApplicationRunner {

    private final DepartmentRepository departmentRepository;

    private static final List<SeedDepartment> DEFAULT_DEPARTMENTS = List.of(
        new SeedDepartment("Electrical", "electrical.authority@example.com"),
        new SeedDepartment("Plumbing", "plumbing.authority@example.com"),
        new SeedDepartment("IT", "it.authority@example.com"),
        new SeedDepartment("Hostel Maintenance", "hostel.maintenance.authority@example.com"),
        new SeedDepartment("Mess", "mess.authority@example.com"),
        new SeedDepartment("Security", "security.authority@example.com"),
        new SeedDepartment("Harassment Response", "harassment.response.authority@example.com"),
        new SeedDepartment("Academic", "academic.authority@example.com"),
        new SeedDepartment("Faculty", "faculty.authority@example.com"),
        new SeedDepartment("Administration", "administration.authority@example.com")
    );

    @Override
    public void run(ApplicationArguments args) {
        int created = 0;
        for (SeedDepartment seed : DEFAULT_DEPARTMENTS) {
            if (departmentRepository.existsByNameIgnoreCase(seed.name())) {
                continue;
            }
            Department department = new Department();
            department.setName(seed.name());
            department.setAuthorityEmail(seed.authorityEmail());
            departmentRepository.save(department);
            created++;
        }

        if (created > 0) {
            log.info("Seeded {} default departments for AI mapping/workflow startup", created);
        } else {
            log.info("Default department seed skipped (all default departments already exist)");
        }
    }

    private record SeedDepartment(String name, String authorityEmail) {}
}
