package vn.edu.ptit.campushub.report;

import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.ptit.campushub.claim.ClaimRequestRepository;
import vn.edu.ptit.campushub.common.ApiException;
import vn.edu.ptit.campushub.post.Post;
import vn.edu.ptit.campushub.post.PostRepository;
import vn.edu.ptit.campushub.post.PostStatus;
import vn.edu.ptit.campushub.report.PostReportDtos.AdminStatsView;
import vn.edu.ptit.campushub.report.PostReportDtos.CreateReportRequest;
import vn.edu.ptit.campushub.report.PostReportDtos.ReportView;
import vn.edu.ptit.campushub.user.Role;
import vn.edu.ptit.campushub.user.User;
import vn.edu.ptit.campushub.user.UserRepository;

@Service
@Transactional(readOnly = true)
public class PostReportService {
    private final PostReportRepository reports;
    private final PostRepository posts;
    private final UserRepository users;
    private final ClaimRequestRepository claimRequests;

    public PostReportService(PostReportRepository reports, PostRepository posts,
                             UserRepository users, ClaimRequestRepository claimRequests) {
        this.reports = reports;
        this.posts = posts;
        this.users = users;
        this.claimRequests = claimRequests;
    }

    @Transactional
    public ReportView reportPost(Long postId, CreateReportRequest request, Principal principal) {
        User reporter = requireUser(principal);
        Post post = posts.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng"));

        if (reports.findByPostIdAndReporterIdAndStatus(postId, reporter.getId(), ReportStatus.PENDING).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn đã báo cáo bài đăng này và đang chờ quản trị viên xử lý");
        }

        PostReport report = new PostReport(post, reporter, request.reason(),
                request.detail() != null ? request.detail().trim() : null);
        return ReportView.from(reports.save(report));
    }

    public List<ReportView> listReports(ReportStatus status, Principal principal) {
        requireAdmin(principal);
        List<PostReport> list = status != null
                ? reports.findByStatusOrderByCreatedAtDesc(status)
                : reports.findAllByOrderByCreatedAtDesc();
        return list.stream().map(ReportView::from).toList();
    }

    @Transactional
    public ReportView dismissReport(Long reportId, Principal principal) {
        requireAdmin(principal);
        PostReport report = reports.findById(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo"));
        report.changeStatus(ReportStatus.DISMISSED);
        return ReportView.from(report);
    }

    @Transactional
    public ReportView hideReportedPost(Long reportId, Principal principal) {
        requireAdmin(principal);
        PostReport report = reports.findById(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo"));
        Post post = report.getPost();
        post.changeStatus(PostStatus.HIDDEN);
        report.changeStatus(ReportStatus.REVIEWED);

        // Đánh dấu tất cả các báo cáo khác của bài này là REVIEWED
        List<PostReport> otherReports = reports.findByPostId(post.getId());
        for (PostReport other : otherReports) {
            other.changeStatus(ReportStatus.REVIEWED);
        }

        return ReportView.from(report);
    }

    public AdminStatsView getAdminStats(Principal principal) {
        requireAdmin(principal);
        long totalUsers = users.count();
        long totalPosts = posts.count();
        List<Post> allPosts = posts.findAll();
        long activePosts = allPosts.stream().filter(p -> p.getStatus() == PostStatus.PUBLISHED).count();
        long resolvedPosts = allPosts.stream().filter(p -> p.getStatus() == PostStatus.RESOLVED).count();
        long hiddenPosts = allPosts.stream().filter(p -> p.getStatus() == PostStatus.HIDDEN).count();
        long totalClaims = claimRequests.count();
        long pendingReports = reports.countByStatus(ReportStatus.PENDING);

        return new AdminStatsView(totalUsers, totalPosts, activePosts, resolvedPosts, hiddenPosts, totalClaims, pendingReports);
    }

    private User requireUser(Principal principal) {
        if (principal == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập");
        }
        return users.findByUsername(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Không tìm thấy tài khoản"));
    }

    private void requireAdmin(Principal principal) {
        User user = requireUser(principal);
        if (user.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Chỉ quản trị viên có quyền truy cập");
        }
    }
}
