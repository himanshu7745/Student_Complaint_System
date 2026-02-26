package com.codex.scms.upload;

import com.codex.scms.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
@Tag(name = "Uploads")
public class UploadController {
    private final ImgBbUploadService imgBbUploadService;

    @PostMapping("/images")
    public ApiResponse<UploadDtos.UploadImagesResponse> uploadImages(@RequestParam("files") List<MultipartFile> files) {
        return ApiResponse.ok("Images uploaded", imgBbUploadService.uploadImages(files));
    }
}
