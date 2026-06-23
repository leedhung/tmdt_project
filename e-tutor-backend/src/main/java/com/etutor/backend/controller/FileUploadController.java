package com.etutor.backend.controller;

import com.etutor.backend.service.CloudinaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/upload")
public class FileUploadController {

    private final CloudinaryService cloudinaryService;

    public FileUploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping("/certificate")
    public ResponseEntity<?> uploadCertificate(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "Tệp tải lên trống hoặc không hợp lệ!");
                return ResponseEntity.badRequest().body(err);
            }

            // Kiểm tra dung lượng tệp (giới hạn tối đa 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "Dung lượng tệp vượt quá giới hạn cho phép (tối đa 10MB)!");
                return ResponseEntity.badRequest().body(err);
            }

            // Kiểm tra định dạng tệp (chỉ hỗ trợ hình ảnh hoặc file PDF)
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "Hệ thống chỉ hỗ trợ tải lên tài liệu hình ảnh (JPG, PNG, JPEG) hoặc văn bản định dạng PDF!");
                return ResponseEntity.badRequest().body(err);
            }

            String secureUrl = cloudinaryService.uploadFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("url", secureUrl);
            response.put("name", file.getOriginalFilename());
            response.put("type", contentType);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Lỗi tải tệp: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }
}
