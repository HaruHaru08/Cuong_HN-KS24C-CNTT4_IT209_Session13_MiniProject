package vn.edu.ptit.campushub;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ReportAndAdminApiIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void studentCanReportPost() throws Exception {
        mockMvc.perform(post("/api/posts/1/report")
                        .with(httpBasic("student", "student123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reason": "SPAM",
                                  "detail": "Bài đăng có dấu hiệu lặp lại và spam quảng cáo"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reason").value("SPAM"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void nonAdminCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/reports")
                        .with(httpBasic("student", "student123")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/stats")
                        .with(httpBasic("student", "student123")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanViewReportsAndHidePost() throws Exception {
        // Sinh viên tạo bài vi phạm
        String createPostResponse = mockMvc.perform(post("/api/posts")
                        .with(httpBasic("student", "student123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Bán tài liệu đề cương trái phép","content":"Nội dung vi phạm quy chế","categoryId":3}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long postId = ((Number) JsonPath.read(createPostResponse, "$.id")).longValue();

        // Một người khác (admin hoặc sinh viên) báo cáo bài này
        String reportResponse = mockMvc.perform(post("/api/posts/" + postId + "/report")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reason": "FRAUD",
                                  "detail": "Nội dung vi phạm quy chế học tập PTIT"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long reportId = ((Number) JsonPath.read(reportResponse, "$.id")).longValue();

        // Admin xem danh sách báo cáo
        mockMvc.perform(get("/api/admin/reports")
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Admin xem thống kê hệ thống
        mockMvc.perform(get("/api/admin/stats")
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPosts").isNumber())
                .andExpect(jsonPath("$.pendingReports").isNumber());

        // Admin ẩn bài đăng vi phạm
        mockMvc.perform(patch("/api/admin/reports/" + reportId + "/hide-post")
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVIEWED"));

        // Người dùng ẩn danh không thể xem bài viết đã bị ẩn nữa
        mockMvc.perform(get("/api/posts/" + postId))
                .andExpect(status().isNotFound());
    }
}
