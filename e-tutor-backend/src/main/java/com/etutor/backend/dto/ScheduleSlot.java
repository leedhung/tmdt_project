package com.etutor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleSlot {
    private Integer dayOfWeek; // 1: Thứ 2, 2: Thứ 3, ..., 7: Chủ Nhật (Theo chuẩn chuẩn Việt Nam / ISO)
    private String startTime;  // Định dạng "HH:mm" (ví dụ "19:00")
    private String endTime;    // Định dạng "HH:mm" (ví dụ "21:00")
}
