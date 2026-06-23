package com.etutor.backend.repository;

import com.etutor.backend.model.ClassApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClassApplicationRepository extends JpaRepository<ClassApplication, Long> {
    List<ClassApplication> findByClassId(Long classId);
    List<ClassApplication> findByTutorId(Long tutorId);
    Optional<ClassApplication> findByClassIdAndTutorId(Long classId, Long tutorId);
}
