package com.etutor.backend.repository;

import com.etutor.backend.model.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, Long> {
    List<ClassEntity> findByStudentId(Long studentId);
    List<ClassEntity> findByTutorId(Long tutorId);
    List<ClassEntity> findByStatus(String status);
}
