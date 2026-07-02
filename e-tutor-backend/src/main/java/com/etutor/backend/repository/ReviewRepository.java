package com.etutor.backend.repository;

import com.etutor.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByClassId(Long classId);
    
    List<Review> findByTutorIdOrderByCreatedAtDesc(Long tutorId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.tutorId = :tutorId")
    Double getAverageRatingByTutorId(@Param("tutorId") Long tutorId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.tutorId = :tutorId")
    Long countByTutorId(@Param("tutorId") Long tutorId);
}
