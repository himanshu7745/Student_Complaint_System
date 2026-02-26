package com.codex.scms.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "departments")
public class Department extends BaseEntity {

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(name = "authority_email", nullable = false, length = 255)
    private String authorityEmail;
}
