package com.codex.scms.department;

import com.codex.scms.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/departments")
@RequiredArgsConstructor
@Tag(name = "Departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<DepartmentDtos.DepartmentResponse>> create(@Valid @RequestBody DepartmentDtos.DepartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Department created", departmentService.create(request)));
    }

    @GetMapping
    public ApiResponse<List<DepartmentDtos.DepartmentResponse>> list() {
        return ApiResponse.ok(departmentService.list());
    }

    @GetMapping("/{id}")
    public ApiResponse<DepartmentDtos.DepartmentResponse> get(@PathVariable UUID id) {
        return ApiResponse.ok(departmentService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<DepartmentDtos.DepartmentResponse> update(@PathVariable UUID id, @Valid @RequestBody DepartmentDtos.DepartmentRequest request) {
        return ApiResponse.ok("Department updated", departmentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Object> delete(@PathVariable UUID id) {
        departmentService.delete(id);
        return ApiResponse.ok("Department deleted", null);
    }
}
