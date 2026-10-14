-- V2: Thêm bảng quản lý yêu cầu nhận/trao đổi đồ và báo cáo vi phạm

CREATE TABLE claim_requests (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    claimant_id BIGINT NOT NULL,
    proof_description TEXT NOT NULL,
    contact_info VARCHAR(255) NOT NULL,
    meeting_note VARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'HANDED_OVER')),
    response_message VARCHAR(500) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_claims_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_claims_claimant FOREIGN KEY (claimant_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE post_reports (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('SPAM', 'FRAUD', 'INAPPROPRIATE', 'MISCATEGORIZED', 'OTHER')),
    detail VARCHAR(1000) NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED')),
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_reports_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_claims_post_id ON claim_requests(post_id);
CREATE INDEX idx_claims_claimant_id ON claim_requests(claimant_id);
CREATE INDEX idx_claims_status ON claim_requests(status);

CREATE INDEX idx_reports_post_id ON post_reports(post_id);
CREATE INDEX idx_reports_reporter_id ON post_reports(reporter_id);
CREATE INDEX idx_reports_status ON post_reports(status);
