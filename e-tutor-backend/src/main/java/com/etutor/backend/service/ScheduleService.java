package com.etutor.backend.service;

import com.etutor.backend.dto.ScheduleSlot;
import com.etutor.backend.model.ClassEntity;
import com.etutor.backend.model.Lesson;
import com.etutor.backend.repository.LessonRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class ScheduleService {

    private final LessonRepository lessonRepository;
    private final ObjectMapper objectMapper;

    public ScheduleService(LessonRepository lessonRepository, ObjectMapper objectMapper) {
        this.lessonRepository = lessonRepository;
        this.objectMapper = objectMapper;
    }

    // Thuật toán rải lịch tự động (Schedule Generator)
    @Transactional
    public List<Lesson> generateLessonsForClass(ClassEntity classEntity, LocalDate startDate) {
        List<Lesson> generatedLessons = new ArrayList<>();

        try {
            // 1. Giải mã cấu hình lịch học từ JSON
            List<ScheduleSlot> slots = objectMapper.readValue(
                    classEntity.getScheduleConfig(),
                    new TypeReference<List<ScheduleSlot>>() {}
            );

            if (slots == null || slots.isEmpty()) {
                throw new RuntimeException("Cấu hình lịch học trống!");
            }

            int totalLessons = classEntity.getTotalLessons();
            int generatedCount = 0;
            LocalDate currentDate = startDate;

            // Sắp xếp các slot học trong ngày cho khoa học
            slots.sort(Comparator.comparing(ScheduleSlot::getDayOfWeek)
                    .thenComparing(ScheduleSlot::getStartTime));

            // 2. Lặp qua từng ngày từ ngày bắt đầu để rải lịch
            while (generatedCount < totalLessons) {
                // Lấy thứ trong tuần của ngày hiện tại (Monday=1, ..., Sunday=7)
                int currentDayOfWeek = currentDate.getDayOfWeek().getValue();

                // Kiểm tra xem ngày hiện tại có trùng với slot học nào không
                for (ScheduleSlot slot : slots) {
                    if (slot.getDayOfWeek() == currentDayOfWeek && generatedCount < totalLessons) {
                        LocalTime startTime = LocalTime.parse(slot.getStartTime());
                        LocalTime endTime = LocalTime.parse(slot.getEndTime());

                        // Tạo đối tượng Buổi học (Lesson)
                        Lesson lesson = Lesson.builder()
                                .classId(classEntity.getId())
                                .lessonNumber(generatedCount + 1)
                                .startTime(LocalDateTime.of(currentDate, startTime))
                                .endTime(LocalDateTime.of(currentDate, endTime))
                                .status("UPCOMING")
                                .meetingLink("https://meet.jit.si/etutor-class-" + classEntity.getId() + "-session-" + (generatedCount + 1)) // Mock Link Jitsi
                                .build();

                        generatedLessons.add(lesson);
                        generatedCount++;
                    }
                }

                // Chuyển sang ngày kế tiếp
                currentDate = currentDate.plusDays(1);
            }

            // 3. Lưu toàn bộ buổi học vào Cơ sở dữ liệu
            return lessonRepository.saveAll(generatedLessons);

        } catch (Exception ex) {
            throw new RuntimeException("Không thể tự động sinh lịch học: " + ex.getMessage(), ex);
        }
    }
}
