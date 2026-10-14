package vn.edu.ptit.campushub.report;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.ptit.campushub.report.PostReportDtos.AdminStatsView;
import vn.edu.ptit.campushub.report.PostReportDtos.CreateReportRequest;
import vn.edu.ptit.campushub.report.PostReportDtos.ReportView;

@RestController
@RequestMapping("/api")
public class PostReportController {
    private final PostReportService service;

    public PostReportController(PostReportService service) {
        this.service = service;
    }

    @PostMapping("/posts/{postId}/report")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportView reportPost(@PathVariable Long postId,
                                 @Valid @RequestBody CreateReportRequest request,
                                 Principal principal) {
        return service.reportPost(postId, request, principal);
    }

    @GetMapping("/admin/reports")
    public List<ReportView> listReports(@RequestParam(required = false) ReportStatus status,
                                        Principal principal) {
        return service.listReports(status, principal);
    }

    @PatchMapping("/admin/reports/{reportId}/dismiss")
    public ReportView dismissReport(@PathVariable Long reportId, Principal principal) {
        return service.dismissReport(reportId, principal);
    }

    @PatchMapping("/admin/reports/{reportId}/hide-post")
    public ReportView hideReportedPost(@PathVariable Long reportId, Principal principal) {
        return service.hideReportedPost(reportId, principal);
    }

    @GetMapping("/admin/stats")
    public AdminStatsView getAdminStats(Principal principal) {
        return service.getAdminStats(principal);
    }
}
