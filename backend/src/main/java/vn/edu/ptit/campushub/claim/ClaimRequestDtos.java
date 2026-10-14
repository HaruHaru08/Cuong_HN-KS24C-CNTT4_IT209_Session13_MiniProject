package vn.edu.ptit.campushub.claim;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import vn.edu.ptit.campushub.post.PostDtos.AuthorView;

public final class ClaimRequestDtos {
    private ClaimRequestDtos() {
    }

    public record CreateClaimRequest(
            @NotBlank(message = "Bằng chứng/mô tả xác minh không được để trống")
            @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
            String proofDescription,

            @NotBlank(message = "Thông tin liên hệ (SĐT/Zalo/Email) không được để trống")
            @Size(max = 255, message = "Thông tin liên hệ tối đa 255 ký tự")
            String contactInfo,

            @Size(max = 500, message = "Ghi chú gặp gỡ tối đa 500 ký tự")
            String meetingNote
    ) {
    }

    public record ReviewClaimRequest(
            @NotNull(message = "Trạng thái phê duyệt không được để trống")
            ClaimStatus status,

            @Size(max = 500, message = "Lời nhắn phản hồi tối đa 500 ký tự")
            String responseMessage
    ) {
    }

    public record ClaimView(
            Long id,
            Long postId,
            String postTitle,
            AuthorView claimant,
            String proofDescription,
            String contactInfo,
            String meetingNote,
            ClaimStatus status,
            String responseMessage,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static ClaimView from(ClaimRequest claim) {
            return new ClaimView(
                    claim.getId(),
                    claim.getPost().getId(),
                    claim.getPost().getTitle(),
                    new AuthorView(claim.getClaimant().getId(), claim.getClaimant().getUsername(), claim.getClaimant().getDisplayName()),
                    claim.getProofDescription(),
                    claim.getContactInfo(),
                    claim.getMeetingNote(),
                    claim.getStatus(),
                    claim.getResponseMessage(),
                    claim.getCreatedAt(),
                    claim.getUpdatedAt()
            );
        }
    }
}
