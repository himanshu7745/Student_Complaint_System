package com.campus.complaints.domain.prediction;

import com.campus.complaints.config.PredictionProperties;
import com.campus.complaints.domain.attachment.AttachmentStorageService;
import com.campus.complaints.domain.attachment.ComplaintAttachmentEntity;
import com.campus.complaints.domain.complaint.ComplaintEntity;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PredictionPayloadBuilder {

    private final PredictionProperties predictionProperties;
    private final AttachmentStorageService attachmentStorageService;

    public PredictionApiClient.PredictionRequestItem build(ComplaintEntity complaint, List<ComplaintAttachmentEntity> attachments) {
        List<String> images = attachments == null ? List.of() : attachments.stream()
                .map(this::mapImage)
                .filter(java.util.Objects::nonNull)
                .toList();
        return new PredictionApiClient.PredictionRequestItem(complaint.getTitle(), complaint.getDescription(), images);
    }

    private String mapImage(ComplaintAttachmentEntity attachment) {
        return switch (predictionProperties.getImageInputMode()) {
            case URL -> attachment.getPublicUrl();
            case BASE64 -> attachmentStorageService.asBase64(attachment.getStoragePath(), predictionProperties.getMaxBase64Bytes());
        };
    }
}
