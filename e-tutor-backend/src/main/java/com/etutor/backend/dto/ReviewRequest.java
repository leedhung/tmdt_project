package com.etutor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequest {
    private Long classId;
    private Integer rating;
    private String comment;
}
