CREATE DATABASE IF NOT EXISTS interviewflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE interviewflow;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  user_id             CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  username            VARCHAR(100) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  first_name          VARCHAR(100) NULL,
  last_name           VARCHAR(100) NULL,
  role                ENUM('admin','interviewer','candidate','superAdmin') NOT NULL DEFAULT 'candidate',
  is_active           TINYINT(1)   NOT NULL DEFAULT 1,
  reset_token         VARCHAR(255) NULL,
  reset_token_expires DATETIME     NULL,
  createdAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users MODIFY user_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

CREATE TABLE IF NOT EXISTS super_admins (
  superadmin_id      CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  user_id            CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  level              ENUM('root','operations','support','auditor') NOT NULL DEFAULT 'operations',
  permissions        JSON         NOT NULL,
  two_factor_enabled TINYINT(1)   NOT NULL DEFAULT 0,
  two_factor_secret  VARCHAR(255) NULL,
  ip_whitelist       JSON         NULL,
  created_by_id      CHAR(36)     NULL,
  last_active_at     DATETIME     NULL,
  createdAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt          DATETIME     NULL,
  PRIMARY KEY (superadmin_id),
  UNIQUE KEY uq_super_admins_user_id (user_id),
  CONSTRAINT fk_superadmin_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profiles (
  profile_id         CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  user_id            CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  headline           VARCHAR(255) NULL,
  company            VARCHAR(255) NULL,
  location           VARCHAR(255) NULL,
  experience         VARCHAR(100) NULL,
  ctc                VARCHAR(100) NULL,
  phone              VARCHAR(20)  NULL,
  notice_period      VARCHAR(100) NULL,
  avatar_url         TEXT         NULL,
  skills             JSON         NULL,
  education          JSON         NULL,
  employment         JSON         NULL,
  resume_file_name   VARCHAR(255) NULL,
  resume_upload_date VARCHAR(50)  NULL,
  profile_updated_at DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (profile_id),
  UNIQUE KEY uq_profiles_user_id (user_id),
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS companies (
  company_id         CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  user_id            CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  company_name       VARCHAR(255) NOT NULL,
  tagline            VARCHAR(255) NULL,
  website            VARCHAR(255) NULL,
  industry           VARCHAR(100) NULL,
  company_size       VARCHAR(100) NULL,
  location           VARCHAR(255) NULL,
  contact_phone      VARCHAR(20)  NULL,
  contact_email      VARCHAR(255) NULL,
  logo_url           TEXT         NULL,
  verification_doc   VARCHAR(255) NULL,
  createdAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id),
  UNIQUE KEY uq_companies_user_id (user_id),
  CONSTRAINT fk_company_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS interviewers (
  interviewer_id     CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  user_id            CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  company_id         CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  title              VARCHAR(150) NULL,
  department         VARCHAR(100) NULL,
  specialization     JSON         NULL,
  availability       JSON         NULL,
  is_verified        TINYINT(1)   NOT NULL DEFAULT 0,
  createdAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (interviewer_id),
  UNIQUE KEY uq_interviewers_user_id (user_id),
  CONSTRAINT fk_interviewer_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS candidates (
  candidate_id       CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  user_id            CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  current_role       VARCHAR(150) NULL,
  years_experience   VARCHAR(50)  NULL,
  preferred_location VARCHAR(255) NULL,
  resume_url         TEXT         NULL,
  skills             JSON         NULL,
  application_status ENUM('active','interviewing','hired','rejected') NOT NULL DEFAULT 'active',
  createdAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (candidate_id),
  UNIQUE KEY uq_candidates_user_id (user_id),
  CONSTRAINT fk_candidate_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS interview_requests (
  request_id          CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  candidate_user_id   CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  interviewer_user_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  role_requirement    VARCHAR(150) NOT NULL,
  language            VARCHAR(50)  NULL,
  topic_focus         JSON         NULL,
  scheduled_date      VARCHAR(50)  NULL,
  scheduled_time      VARCHAR(50)  NULL,
  room_code           VARCHAR(50)  NOT NULL,
  candidate_notes     TEXT         NULL,
  meeting_link        VARCHAR(255) NULL,
  status              ENUM('pending','accepted','rejected','completed') NOT NULL DEFAULT 'pending',
  createdAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id),
  KEY idx_req_candidate (candidate_user_id),
  KEY idx_req_interviewer (interviewer_user_id),
  CONSTRAINT fk_req_candidate FOREIGN KEY (candidate_user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_req_interviewer FOREIGN KEY (interviewer_user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ALTER QUERIES FOR EXISTING DATABASES / NEW FIELDS MIGRATIONS
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table (Role enum updates and password reset token fields)
ALTER TABLE users MODIFY COLUMN role ENUM('admin','interviewer','candidate','superAdmin') NOT NULL DEFAULT 'candidate';
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL AFTER is_active;
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL AFTER reset_token;

-- 2. Interviewers Table (Availability slot array and verification flag)
ALTER TABLE interviewers ADD COLUMN specialization JSON NULL AFTER department;
ALTER TABLE interviewers ADD COLUMN availability JSON NULL AFTER specialization;
ALTER TABLE interviewers ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER availability;

-- 3. Companies Table (PDF verification document and branding)
ALTER TABLE companies ADD COLUMN logo_url TEXT NULL AFTER contact_email;
ALTER TABLE companies ADD COLUMN verification_doc VARCHAR(255) NULL AFTER logo_url;

-- 4. Candidates Table (Resume PDF URL and Skill tags JSON array)
ALTER TABLE candidates ADD COLUMN resume_url TEXT NULL AFTER preferred_location;
ALTER TABLE candidates ADD COLUMN skills JSON NULL AFTER resume_url;

-- 5. Interview Requests Table (Google Meet link and scheduled time slot)
ALTER TABLE interview_requests ADD COLUMN scheduled_time VARCHAR(50) NULL AFTER scheduled_date;
ALTER TABLE interview_requests ADD COLUMN meeting_link VARCHAR(255) NULL AFTER candidate_notes;

SET FOREIGN_KEY_CHECKS = 1;

