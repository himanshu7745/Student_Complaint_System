package com.campus.complaints.domain.settings;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppSettingRepository extends JpaRepository<AppSettingEntity, Long> {
    Optional<AppSettingEntity> findBySettingKey(String settingKey);
}
