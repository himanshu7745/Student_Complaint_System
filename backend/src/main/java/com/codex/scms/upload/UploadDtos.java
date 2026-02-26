package com.codex.scms.upload;

import java.util.List;

public final class UploadDtos {
    private UploadDtos() {}

    public record UploadedImage(String url, String deleteHash) {}
    public record UploadImagesResponse(List<String> imageUrls, List<UploadedImage> images) {}
}
