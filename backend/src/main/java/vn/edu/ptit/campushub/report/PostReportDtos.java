package vn.edu.ptit.campushub.report;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import vn.edu.ptit.campushub.post.PostDtos.AuthorView;

public final class PostReportDtos {
    private PostReportDtos() {
    }

    public record CreateReportRequest(
            @NotNull(message = "Lý do báo cáo không được để trống")
            ReportReason reason,

            @Size(max = 1000, message = "Chi tiết báo cáo tối đa 1000 ký tự")
            String detail
    ) {
    }

    public record ReportView(
            Long id,
            Long postId,
            String postTitle,
            AuthorView reporter,
            ReportReason reason,
            String detail,
            ReportStatus status,
            Instant createdAt
    ) {
        public static ReportView from(PostReport report) {
            return new ReportView(
                    report.getId(),
                    report.getPost().getId(),
                    report.getPost().getTitle(),
                    new AuthorView(report.getReporter().getId(), report.getReporter().getUsername(),
                            report.getReporter().getDisplayName()),
                    report.getReason(),
                    report.getDetail(),
                    report.getStatus(),
                    report.getCreatedAt()
            );
        }
    }

    public record AdminStatsView(
            long totalUsers,
            long totalPosts,
            long activePosts,
            long resolvedPosts,
            long hiddenPosts,
            long totalClaims,
            long pendingReports
    ) {
    }
}
