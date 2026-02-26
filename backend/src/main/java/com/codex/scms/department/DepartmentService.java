package com.codex.scms.department;

import com.codex.scms.common.AppException;
import com.codex.scms.domain.entity.Department;
import com.codex.scms.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Transactional
    public DepartmentDtos.DepartmentResponse create(DepartmentDtos.DepartmentRequest request) {
        if (departmentRepository.existsByNameIgnoreCase(request.name())) {
            throw new AppException(HttpStatus.CONFLICT, "Department name already exists");
        }
        Department department = new Department();
        department.setName(request.name().trim());
        department.setAuthorityEmail(request.authorityEmail().trim().toLowerCase());
        return toResponse(departmentRepository.save(department));
    }

    @Transactional(readOnly = true)
    public List<DepartmentDtos.DepartmentResponse> list() {
        return departmentRepository.findAll().stream()
            .sorted(Comparator.comparing(Department::getName, String.CASE_INSENSITIVE_ORDER))
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentDtos.DepartmentResponse get(UUID id) {
        return toResponse(getEntity(id));
    }

    @Transactional
    public DepartmentDtos.DepartmentResponse update(UUID id, DepartmentDtos.DepartmentRequest request) {
        Department department = getEntity(id);
        if (!department.getName().equalsIgnoreCase(request.name()) && departmentRepository.existsByNameIgnoreCase(request.name())) {
            throw new AppException(HttpStatus.CONFLICT, "Department name already exists");
        }
        department.setName(request.name().trim());
        department.setAuthorityEmail(request.authorityEmail().trim().toLowerCase());
        return toResponse(departmentRepository.save(department));
    }

    @Transactional
    public void delete(UUID id) {
        Department department = getEntity(id);
        departmentRepository.delete(department);
    }

    public Department getEntity(UUID id) {
        return departmentRepository.findById(id)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Department not found"));
    }

    private DepartmentDtos.DepartmentResponse toResponse(Department d) {
        return new DepartmentDtos.DepartmentResponse(d.getId(), d.getName(), d.getAuthorityEmail(), d.getCreatedAt(), d.getUpdatedAt());
    }
}
