package vn.edu.ptit.campushub.report;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {
    List<PostReport> findByStatusOrderByCreatedAtDesc(ReportStatus status);

    List<PostReport> findAllByOrderByCreatedAtDesc();

    List<PostReport> findByPostId(Long postId);

    Optional<PostReport> findByPostIdAndReporterIdAndStatus(Long postId, Long reporterId, ReportStatus status);

    long countByStatus(ReportStatus status);
}
