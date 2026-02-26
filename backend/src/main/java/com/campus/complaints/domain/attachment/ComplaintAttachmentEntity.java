package com.campus.complaints.domain.attachment;

import com.campus.complaints.domain.common.BaseEntity;
import com.campus.complaints.domain.complaint.ComplaintEntity;
import com.campus.complaints.domain.user.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "complaint_attachments")
public class ComplaintAttachmentEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id")
    private ComplaintEntity complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private UserEntity uploader;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(nullable = false)
    private Long size;

    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    @Column(name = "public_url")
    private String publicUrl;
}
