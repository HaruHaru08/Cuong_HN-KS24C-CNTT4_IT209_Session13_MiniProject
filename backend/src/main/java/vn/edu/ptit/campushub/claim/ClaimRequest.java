package vn.edu.ptit.campushub.claim;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import vn.edu.ptit.campushub.post.Post;
import vn.edu.ptit.campushub.user.User;

@Entity
@Table(name = "claim_requests")
public class ClaimRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claimant_id")
    private User claimant;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String proofDescription;

    @Column(nullable = false, length = 255)
    private String contactInfo;

    @Column(length = 500)
    private String meetingNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClaimStatus status = ClaimStatus.PENDING;

    @Column(length = 500)
    private String responseMessage;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected ClaimRequest() {
    }

    public ClaimRequest(Post post, User claimant, String proofDescription, String contactInfo, String meetingNote) {
        this.post = post;
        this.claimant = claimant;
        this.proofDescription = proofDescription;
        this.contactInfo = contactInfo;
        this.meetingNote = meetingNote;
        this.status = ClaimStatus.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void updateStatus(ClaimStatus status, String responseMessage) {
        this.status = status;
        this.responseMessage = responseMessage;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Post getPost() { return post; }
    public User getClaimant() { return claimant; }
    public String getProofDescription() { return proofDescription; }
    public String getContactInfo() { return contactInfo; }
    public String getMeetingNote() { return meetingNote; }
    public ClaimStatus getStatus() { return status; }
    public String getResponseMessage() { return responseMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
