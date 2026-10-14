package vn.edu.ptit.campushub.claim;

import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.ptit.campushub.claim.ClaimRequestDtos.ClaimView;
import vn.edu.ptit.campushub.claim.ClaimRequestDtos.CreateClaimRequest;
import vn.edu.ptit.campushub.claim.ClaimRequestDtos.ReviewClaimRequest;
import vn.edu.ptit.campushub.common.ApiException;
import vn.edu.ptit.campushub.post.Post;
import vn.edu.ptit.campushub.post.PostRepository;
import vn.edu.ptit.campushub.post.PostStatus;
import vn.edu.ptit.campushub.user.Role;
import vn.edu.ptit.campushub.user.User;
import vn.edu.ptit.campushub.user.UserRepository;

@Service
@Transactional(readOnly = true)
public class ClaimRequestService {
    private final ClaimRequestRepository claimRequests;
    private final PostRepository posts;
    private final UserRepository users;

    public ClaimRequestService(ClaimRequestRepository claimRequests, PostRepository posts, UserRepository users) {
        this.claimRequests = claimRequests;
        this.posts = posts;
        this.users = users;
    }

    @Transactional
    public ClaimView createClaim(Long postId, CreateClaimRequest request, Principal principal) {
        User claimant = requireUser(principal);
        Post post = findPost(postId);

        if (post.getStatus() == PostStatus.HIDDEN) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng");
        }
        if (post.getStatus() == PostStatus.RESOLVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bài đăng này đã được đánh dấu hoàn tất, không thể gửi yêu cầu");
        }
        if (post.getAuthor().getId().equals(claimant.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn không thể gửi yêu cầu nhận đồ trên chính bài đăng của mình");
        }

        if (claimRequests.findByPostIdAndClaimantIdAndStatus(postId, claimant.getId(), ClaimStatus.PENDING).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn đã có một yêu cầu đang chờ phê duyệt cho bài đăng này");
        }

        ClaimRequest claim = new ClaimRequest(post, claimant, request.proofDescription().trim(),
                request.contactInfo().trim(), request.meetingNote() != null ? request.meetingNote().trim() : null);
        return ClaimView.from(claimRequests.save(claim));
    }

    public List<ClaimView> getClaimsForPost(Long postId, Principal principal) {
        User user = requireUser(principal);
        Post post = findPost(postId);

        boolean isAuthorOrAdmin = post.getAuthor().getId().equals(user.getId()) || user.getRole() == Role.ADMIN;
        List<ClaimRequest> results;
        if (isAuthorOrAdmin) {
            results = claimRequests.findByPostIdOrderByCreatedAtDesc(postId);
        } else {
            results = claimRequests.findByPostIdAndClaimantIdOrderByCreatedAtDesc(postId, user.getId());
        }
        return results.stream().map(ClaimView::from).toList();
    }

    @Transactional
    public ClaimView reviewClaim(Long postId, Long claimId, ReviewClaimRequest request, Principal principal) {
        User reviewer = requireUser(principal);
        ClaimRequest claim = findClaim(claimId);

        if (!claim.getPost().getId().equals(postId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Yêu cầu không thuộc bài đăng chỉ định");
        }

        requireOwnerOrAdmin(claim.getPost(), reviewer);

        if (request.status() != ClaimStatus.APPROVED && request.status() != ClaimStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trạng thái phê duyệt chỉ có thể là APPROVED hoặc REJECTED");
        }

        claim.updateStatus(request.status(), request.responseMessage());
        return ClaimView.from(claim);
    }

    @Transactional
    public ClaimView completeHandover(Long postId, Long claimId, Principal principal) {
        User reviewer = requireUser(principal);
        ClaimRequest claim = findClaim(claimId);
        Post post = claim.getPost();

        if (!post.getId().equals(postId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Yêu cầu không thuộc bài đăng chỉ định");
        }

        requireOwnerOrAdmin(post, reviewer);

        claim.updateStatus(ClaimStatus.HANDED_OVER, "Đã hoàn tất bàn giao thành công!");
        post.changeStatus(PostStatus.RESOLVED);

        // Đóng các claim PENDING khác
        List<ClaimRequest> allClaims = claimRequests.findByPostIdOrderByCreatedAtDesc(postId);
        for (ClaimRequest other : allClaims) {
            if (!other.getId().equals(claimId) && other.getStatus() == ClaimStatus.PENDING) {
                other.updateStatus(ClaimStatus.REJECTED, "Bài đăng đã được bàn giao cho người khác.");
            }
        }

        return ClaimView.from(claim);
    }

    private Post findPost(Long id) {
        return posts.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng"));
    }

    private ClaimRequest findClaim(Long id) {
        return claimRequests.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu nhận đồ"));
    }

    private User requireUser(Principal principal) {
        if (principal == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để tiếp tục");
        }
        return users.findByUsername(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Không tìm thấy thông tin tài khoản"));
    }

    private void requireOwnerOrAdmin(Post post, User user) {
        if (!post.getAuthor().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền quản lý yêu cầu của bài đăng này");
        }
    }
}
