package com.etutor.backend.repository;

import com.etutor.backend.model.TutorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TutorProfileRepository extends JpaRepository<TutorProfile, Long> {
    List<TutorProfile> findByStatus(String status);
}
