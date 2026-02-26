package com.campus.complaints.domain.settings;

import com.campus.complaints.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PredictionThresholdService {

    public static final String KEY = "prediction.threshold";

    private final AppSettingRepository appSettingRepository;
    private final AppProperties appProperties;

    @Transactional(readOnly = true)
    public double getThreshold() {
        return appSettingRepository.findBySettingKey(KEY)
                .map(AppSettingEntity::getSettingValue)
                .map(Double::parseDouble)
                .orElse(appProperties.getPredictionThreshold());
    }

    @Transactional
    public double updateThreshold(double threshold) {
        AppSettingEntity setting = appSettingRepository.findBySettingKey(KEY).orElseGet(AppSettingEntity::new);
        setting.setSettingKey(KEY);
        setting.setSettingValue(Double.toString(threshold));
        appSettingRepository.save(setting);
        return threshold;
    }
}
