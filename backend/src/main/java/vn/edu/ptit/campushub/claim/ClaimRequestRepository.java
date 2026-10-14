package vn.edu.ptit.campushub.claim;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimRequestRepository extends JpaRepository<ClaimRequest, Long> {
    List<ClaimRequest> findByPostIdOrderByCreatedAtDesc(Long postId);

    List<ClaimRequest> findByPostIdAndClaimantIdOrderByCreatedAtDesc(Long postId, Long claimantId);

    Optional<ClaimRequest> findByPostIdAndClaimantIdAndStatus(Long postId, Long claimantId, ClaimStatus status);

    long countByStatus(ClaimStatus status);

    long countByPostId(Long postId);
}
