package com.etutor.backend.repository;

import com.etutor.backend.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByClassIdOrderByLessonNumberAsc(Long classId);
    List<Lesson> findByStatus(String status);
}
