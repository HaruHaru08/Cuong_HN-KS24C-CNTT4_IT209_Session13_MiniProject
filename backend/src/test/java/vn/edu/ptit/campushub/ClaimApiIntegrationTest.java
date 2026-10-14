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
class ClaimApiIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void studentCanSubmitClaimForLostItem() throws Exception {
        mockMvc.perform(post("/api/posts/1/claims")
                        .with(httpBasic("student", "student123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "proofDescription": "Em là người làm rơi tài liệu ở sự kiện",
                                  "contactInfo": "0987654321 / zalo: student_ptit",
                                  "meetingNote": "Hẹn gặp tại sảnh A2 lúc 10h"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.claimant.username").value("student"));
    }

    @Test
    void cannotClaimOwnPost() throws Exception {
        mockMvc.perform(post("/api/posts/2/claims")
                        .with(httpBasic("student", "student123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "proofDescription": "Tự nhận đồ",
                                  "contactInfo": "0987654321"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Bạn không thể gửi yêu cầu nhận đồ trên chính bài đăng của mình"));
    }

    @Test
    void postAuthorCanReviewAndHandoverClaim() throws Exception {
        String createPostResponse = mockMvc.perform(post("/api/posts")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Nhặt được thẻ sinh viên PTIT B22DCCN001","content":"Nhặt được ở cầu thang A2","categoryId":2}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long postId = ((Number) JsonPath.read(createPostResponse, "$.id")).longValue();

        String claimResponse = mockMvc.perform(post("/api/posts/" + postId + "/claims")
                        .with(httpBasic("student", "student123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "proofDescription": "Thẻ SV mang tên em Nguyễn Minh Anh, mã B22DCCN001",
                                  "contactInfo": "0912345678",
                                  "meetingNote": "Gặp ở cửa thư viện"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long claimId = ((Number) JsonPath.read(claimResponse, "$.id")).longValue();

        mockMvc.perform(get("/api/posts/" + postId + "/claims")
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(claimId));

        mockMvc.perform(patch("/api/posts/" + postId + "/claims/" + claimId + "/status")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "APPROVED",
                                  "responseMessage": "Đúng thông tin rồi nhé, hẹn gặp ở thư viện!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mockMvc.perform(post("/api/posts/" + postId + "/claims/" + claimId + "/handover")
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HANDED_OVER"));

        mockMvc.perform(get("/api/posts/" + postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));
    }
}
