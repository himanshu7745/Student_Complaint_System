package com.codex.scms.upload;

import com.codex.scms.common.AppException;
import com.codex.scms.config.AppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImgBbUploadService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AppProperties appProperties;

    public UploadDtos.UploadImagesResponse uploadImages(List<MultipartFile> files) {
        validateFiles(files);
        List<UploadDtos.UploadedImage> uploaded = files.stream().map(this::uploadSingle).toList();
        return new UploadDtos.UploadImagesResponse(uploaded.stream().map(UploadDtos.UploadedImage::url).toList(),
                uploaded);
    }

    private void validateFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new AppException(org.springframework.http.HttpStatus.BAD_REQUEST,
                    "At least one image file is required");
        }
        if (files.size() > appProperties.getImgbb().getMaxImageCount()) {
            throw new AppException(org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Maximum %d images allowed".formatted(appProperties.getImgbb().getMaxImageCount()));
        }
        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                throw new AppException(org.springframework.http.HttpStatus.BAD_REQUEST, "Empty file is not allowed");
            }
            if (file.getSize() > appProperties.getImgbb().getMaxImageSizeBytes()) {
                throw new AppException(org.springframework.http.HttpStatus.BAD_REQUEST,
                        "File exceeds max size: %s".formatted(file.getOriginalFilename()));
            }
            String mimeType = file.getContentType();
            if (mimeType == null || !appProperties.getImgbb().getAllowedMimeTypes().contains(mimeType)) {
                throw new AppException(org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Unsupported file type: %s".formatted(file.getOriginalFilename()));
            }
        }
    }

    private UploadDtos.UploadedImage uploadSingle(MultipartFile file) {
        String apiKey = appProperties.getImgbb().getApiKey();

        // Local Fallback if API key is not configured or left as default
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("replace-with-imgbb-api-key")) {
            return saveLocally(file);
        }

        try {
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("key", apiKey);
            body.add("image", base64);
            if (appProperties.getImgbb().getExpirationSeconds() > 0) {
                body.add("expiration", String.valueOf(appProperties.getImgbb().getExpirationSeconds()));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(appProperties.getImgbb().getBaseUrl(), entity,
                    String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            if (!root.path("success").asBoolean(false)) {
                throw new AppException(org.springframework.http.HttpStatus.BAD_GATEWAY, "imgbb upload failed");
            }
            JsonNode data = root.path("data");
            String url = data.path("url").asText(null);
            String deleteHash = data.path("delete_hash").asText(null);
            if ((deleteHash == null || deleteHash.isBlank()) && data.hasNonNull("delete_url")) {
                String deleteUrl = data.path("delete_url").asText("");
                int idx = deleteUrl.lastIndexOf('/');
                if (idx >= 0 && idx < deleteUrl.length() - 1) {
                    deleteHash = deleteUrl.substring(idx + 1);
                }
            }
            if (url == null || url.isBlank()) {
                throw new AppException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                        "imgbb response missing image URL");
            }
            return new UploadDtos.UploadedImage(url, (deleteHash == null || deleteHash.isBlank()) ? null : deleteHash);
        } catch (IOException e) {
            throw new AppException(org.springframework.http.HttpStatus.BAD_REQUEST, "Failed to read image file");
        } catch (RestClientException e) {
            log.error("imgbb upload failed", e);
            throw new AppException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Image hosting service unavailable");
        }
    }

    private UploadDtos.UploadedImage saveLocally(MultipartFile file) {
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String fileName = java.util.UUID.randomUUID().toString() + extension;
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads");

            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }

            java.nio.file.Path filePath = uploadDir.resolve(fileName);
            file.transferTo(filePath.toFile());

            String backendUrl = appProperties.getPublicUrls().getBackendBaseUrl();
            if (backendUrl == null || backendUrl.isBlank() || backendUrl.equals("http://localhost:8080")) {
                backendUrl = "http://localhost:8080";
            }
            if (backendUrl.endsWith("/")) {
                backendUrl = backendUrl.substring(0, backendUrl.length() - 1);
            }

            String fileUrl = backendUrl + "/uploads/" + fileName;
            return new UploadDtos.UploadedImage(fileUrl, fileName); // use fileName as deleteHash

        } catch (IOException e) {
            log.error("Failed to save file locally", e);
            throw new AppException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to save file locally");
        }
    }
}
