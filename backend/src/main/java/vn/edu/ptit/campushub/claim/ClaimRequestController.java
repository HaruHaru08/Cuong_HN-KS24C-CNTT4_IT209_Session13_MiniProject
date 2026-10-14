package vn.edu.ptit.campushub.claim;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.ptit.campushub.claim.ClaimRequestDtos.ClaimView;
import vn.edu.ptit.campushub.claim.ClaimRequestDtos.CreateClaimRequest;
import vn.edu.ptit.campushub.claim.ClaimRequestDtos.ReviewClaimRequest;

@RestController
@RequestMapping("/api/posts/{postId}/claims")
public class ClaimRequestController {
    private final ClaimRequestService service;

    public ClaimRequestController(ClaimRequestService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClaimView createClaim(@PathVariable Long postId,
                                 @Valid @RequestBody CreateClaimRequest request,
                                 Principal principal) {
        return service.createClaim(postId, request, principal);
    }

    @GetMapping
    public List<ClaimView> getClaims(@PathVariable Long postId, Principal principal) {
        return service.getClaimsForPost(postId, principal);
    }

    @PatchMapping("/{claimId}/status")
    public ClaimView reviewClaim(@PathVariable Long postId,
                                 @PathVariable Long claimId,
                                 @Valid @RequestBody ReviewClaimRequest request,
                                 Principal principal) {
        return service.reviewClaim(postId, claimId, request, principal);
    }

    @PostMapping("/{claimId}/handover")
    public ClaimView completeHandover(@PathVariable Long postId,
                                      @PathVariable Long claimId,
                                      Principal principal) {
        return service.completeHandover(postId, claimId, principal);
    }
}
