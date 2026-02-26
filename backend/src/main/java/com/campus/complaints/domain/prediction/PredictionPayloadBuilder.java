package com.campus.complaints.domain.prediction;

import com.campus.complaints.config.PredictionProperties;
import com.campus.complaints.domain.attachment.AttachmentStorageService;
import com.campus.complaints.domain.attachment.ComplaintAttachmentEntity;
import com.campus.complaints.domain.complaint.ComplaintEntity;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PredictionPayloadBuilder {

    private final PredictionProperties predictionProperties;
    private final AttachmentStorageService attachmentStorageService;

    public PredictionApiClient.PredictionRequestItem build(ComplaintEntity complaint, List<ComplaintAttachmentEntity> attachments) {
        List<Object> images = attachments == null ? List.of() : attachments.stream()
                .filter(this::isImageAttachment)
                .map(this::mapImage)
                .filter(java.util.Objects::nonNull)
                .toList();
        return new PredictionApiClient.PredictionRequestItem(complaint.getTitle(), complaint.getDescription(), images);
    }

    private Object mapImage(ComplaintAttachmentEntity attachment) {
        return switch (predictionProperties.getImageInputMode()) {
            case URL -> attachment.getPublicUrl();
            case BASE64 -> attachmentStorageService.asBase64(attachment.getStoragePath(), predictionProperties.getMaxBase64Bytes());
            case BYTES -> toUnsignedByteList(attachmentStorageService.readBytes(attachment.getStoragePath()));
        };
    }

    private boolean isImageAttachment(ComplaintAttachmentEntity attachment) {
        return attachment != null
                && attachment.getMimeType() != null
                && attachment.getMimeType().toLowerCase().startsWith("image/");
    }

    private List<Integer> toUnsignedByteList(byte[] bytes) {
        if (bytes == null || bytes.length == 0) return List.of();
        int cap = Math.max(1, predictionProperties.getMaxBase64Bytes());
        byte[] limited = bytes.length > cap ? Arrays.copyOf(bytes, cap) : bytes;
        return java.util.stream.IntStream.range(0, limited.length)
                .map(i -> Byte.toUnsignedInt(limited[i]))
                .boxed()
                .toList();
    }
}
