package com.campus.complaints.domain.attachment;

import com.campus.complaints.config.StorageProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class AttachmentStorageService {

    private final StorageProperties storageProperties;

    public StoredFile store(MultipartFile file) {
        try {
            String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
            String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
            String savedName = UUID.randomUUID() + ext;
            Path root = Path.of(storageProperties.getLocalRoot()).toAbsolutePath().normalize();
            Files.createDirectories(root);
            Path target = root.resolve(savedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            String publicUrl = buildPublicUrl(savedName, file.getContentType());
            return new StoredFile(target.toString(), publicUrl, original, file.getContentType(), file.getSize(), savedName);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file", ex);
        }
    }

    private String buildPublicUrl(String savedName, String mimeType) {
        String base = storageProperties.getPublicBaseUrl();
        if (StringUtils.hasText(storageProperties.getCdnBaseUrl())) {
            boolean useCdn = !storageProperties.isCdnImagesOnly() || isImageMime(mimeType);
            if (useCdn) {
                base = storageProperties.getCdnBaseUrl();
            }
        }
        return joinUrl(base, savedName);
    }

    private boolean isImageMime(String mimeType) {
        return mimeType != null && mimeType.toLowerCase().startsWith("image/");
    }

    private String joinUrl(String base, String pathPart) {
        String normalizedBase = (base == null ? "" : base).replaceAll("/+$", "");
        String normalizedPath = pathPart == null ? "" : pathPart.replaceAll("^/+", "");
        return normalizedBase + "/" + normalizedPath;
    }

    public byte[] readBytes(String storagePath) {
        try {
            return Files.readAllBytes(Path.of(storagePath));
        } catch (IOException ex) {
            throw new RuntimeException("Unable to read attachment bytes", ex);
        }
    }

    public String asBase64(String storagePath, int maxBytes) {
        byte[] bytes = readBytes(storagePath);
        if (maxBytes > 0 && bytes.length > maxBytes) {
            byte[] truncated = java.util.Arrays.copyOf(bytes, maxBytes);
            return Base64.getEncoder().encodeToString(truncated);
        }
        return Base64.getEncoder().encodeToString(bytes);
    }

    public Resource loadAsResource(String fileName) {
        try {
            Path file = Path.of(storageProperties.getLocalRoot()).toAbsolutePath().normalize().resolve(fileName);
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists()) throw new RuntimeException("File not found");
            return resource;
        } catch (Exception ex) {
            throw new RuntimeException("File not found", ex);
        }
    }

    public record StoredFile(String storagePath, String publicUrl, String originalFileName, String mimeType, long size, String savedName) {}
}
