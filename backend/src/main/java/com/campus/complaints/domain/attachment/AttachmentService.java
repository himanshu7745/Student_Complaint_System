package com.campus.complaints.domain.attachment;

import com.campus.complaints.common.exception.NotFoundException;
import com.campus.complaints.domain.complaint.ComplaintEntity;
import com.campus.complaints.domain.user.UserEntity;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentStorageService attachmentStorageService;
    private final ComplaintAttachmentRepository attachmentRepository;

    @Transactional
    public List<ComplaintAttachmentEntity> uploadToComplaint(ComplaintEntity complaint, UserEntity uploader, List<MultipartFile> files) {
        return files.stream().map(file -> {
            AttachmentStorageService.StoredFile stored = attachmentStorageService.store(file);
            ComplaintAttachmentEntity entity = new ComplaintAttachmentEntity();
            entity.setComplaint(complaint);
            entity.setUploader(uploader);
            entity.setFileName(stored.originalFileName());
            entity.setMimeType(stored.mimeType() != null ? stored.mimeType() : "application/octet-stream");
            entity.setSize(stored.size());
            entity.setStoragePath(stored.storagePath());
            entity.setPublicUrl(stored.publicUrl());
            return attachmentRepository.save(entity);
        }).toList();
    }

    @Transactional
    public List<ComplaintAttachmentEntity> attachExisting(Long complaintId, ComplaintEntity complaint, UserEntity uploader, List<Long> attachmentIds) {
        if (attachmentIds == null || attachmentIds.isEmpty()) return List.of();
        return attachmentIds.stream().map(id -> {
            ComplaintAttachmentEntity attachment = attachmentRepository.findById(id)
                    .orElseThrow(() -> new NotFoundException("Attachment not found: " + id));
            if (attachment.getComplaint() != null && !attachment.getComplaint().getId().equals(complaintId)) {
                throw new NotFoundException("Attachment not available for complaint association: " + id);
            }
            if (!attachment.getUploader().getId().equals(uploader.getId())) {
                throw new NotFoundException("Attachment not owned by current user: " + id);
            }
            attachment.setComplaint(complaint);
            return attachmentRepository.save(attachment);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintAttachmentEntity> listByComplaint(ComplaintEntity complaint) {
        return attachmentRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId());
    }

    @Transactional(readOnly = true)
    public ComplaintAttachmentEntity getById(Long id) {
        return attachmentRepository.findById(id).orElseThrow(() -> new NotFoundException("Attachment not found"));
    }
}
