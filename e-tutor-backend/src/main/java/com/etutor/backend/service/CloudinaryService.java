package com.etutor.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadFile(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Tệp tải lên không được để trống!");
            }
            
            // Xác định loại tài nguyên để Cloudinary phân loại đúng (PDF -> raw, ảnh -> image)
            String contentType = file.getContentType();
            String resourceType = "auto";
            if (contentType != null && (contentType.equals("application/pdf") || contentType.contains("pdf"))) {
                resourceType = "raw";
            }

            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "resource_type", resourceType,
                            "folder", "etutor_certificates"
                    )
            );
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            throw new RuntimeException("Tải tệp lên Cloudinary thất bại: " + e.getMessage(), e);
        }
    }
}
