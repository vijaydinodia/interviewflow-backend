-- ============================================================================
-- InterviewFlow Database Schema Initialization Script & Cloud Deployment Config
-- Auto-generated to match all 10 Sequelize Models & Foreign Key Associations
-- Local DB Name: interviewflow
--
-- PRODUCTION CLOUD DATABASE DEPLOYMENT CREDENTIALS (Aiven MySQL):
-- ----------------------------------------------------------------------------
-- Service URI : mysql://avnadmin:AVNS_W7fJfbP_XUBBEHKmxwk@intervierflowvijay-vijaydinodia548-f078.b.aivencloud.com:23385/defaultdb?ssl-mode=REQUIRED
-- Host        : intervierflowvijay-vijaydinodia548-f078.b.aivencloud.com
-- Port        : 23385
-- Database    : defaultdb (or interviewflow)
-- User        : avnadmin
-- Password    : AVNS_W7fJfbP_XUBBEHKmxwk
-- SSL Mode    : REQUIRED
-- ============================================================================

CREATE DATABASE IF NOT EXISTS interviewflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE defaultdb;
USE interviewflow;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE (Core Authentication & System Accounts)
-- Model: userModel.js -> tableName: 'users'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id             CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  username            VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  first_name          VARCHAR(255) NULL,
  last_name           VARCHAR(255) NULL,
  role                ENUM('admin','interviewer','candidate','superAdmin') NOT NULL DEFAULT 'candidate',
  is_active           TINYINT(1)   NOT NULL DEFAULT 1,
  reset_token         VARCHAR(255) NULL,
  reset_token_expires DATETIME     NULL,
  otp_code            VARCHAR(6)   NULL,
  otp_expires         DATETIME     NULL,
  createdAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. SUPER ADMINS TABLE (Super Admin Access & Audit Permissions)
-- Model: superAdminModel.js -> tableName: 'super_admins'
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 3. PROFILES TABLE (User Professional Profile Data)
-- Model: profileModel.js -> tableName: 'profiles'
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 4. COMPANIES TABLE (Company Accounts & Verification Documents)
-- Model: comapanyModel.js -> tableName: 'companies'
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 5. INTERVIEWERS TABLE (Technical Interviewers & Availability)
-- Model: interviewerModel.js -> tableName: 'interviewers'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interviewers (
  interviewer_id     CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  user_id            CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  company_id         CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  title              VARCHAR(150) NULL,
  department         VARCHAR(100) NULL,
  specialization     JSON         NULL,
  availability       JSON         NULL,
  is_verified        TINYINT(1)   NOT NULL DEFAULT 0,
  is_mentor          TINYINT(1)   NOT NULL DEFAULT 1,
  createdAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (interviewer_id),
  UNIQUE KEY uq_interviewers_user_id (user_id),
  CONSTRAINT fk_interviewer_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_interviewer_company FOREIGN KEY (company_id) REFERENCES companies (company_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. CANDIDATES TABLE (Candidate Roles & Application Status)
-- Model: candidateModel.js -> tableName: 'candidates'
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 7. INTERVIEW REQUESTS TABLE (1-to-1 Interview Requests & Open Matching)
-- Model: interviewRequestModel.js -> tableName: 'interview_requests'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interview_requests (
  request_id          CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  candidate_user_id   CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  interviewer_user_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  request_type        ENUM('direct','open') NOT NULL DEFAULT 'direct',
  role_requirement    VARCHAR(150) NOT NULL,
  language            VARCHAR(50)  NULL,
  topic_focus         JSON         NULL,
  scheduled_date      VARCHAR(50)  NULL,
  scheduled_time      VARCHAR(50)  NULL,
  room_code           VARCHAR(50)  NULL,
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

-- ----------------------------------------------------------------------------
-- 8. MEETING LINKS TABLE (Google Meet Pool Management)
-- Model: meetingLinkModel.js -> tableName: 'meeting_links'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meeting_links (
  link_id             INT AUTO_INCREMENT NOT NULL,
  link                VARCHAR(255) NOT NULL,
  is_occupied         TINYINT(1)   NOT NULL DEFAULT 0,
  assigned_request_id CHAR(36)     NULL,
  tag                 VARCHAR(100) NOT NULL DEFAULT 'available',
  duration_minutes    INT          NOT NULL DEFAULT 60,
  occupied_at         DATETIME     NULL,
  release_at          DATETIME     NULL,
  createdAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (link_id),
  UNIQUE KEY uq_meeting_link (link)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. CODE EXECUTIONS TABLE (Online Compiler Code Execution History)
-- Model: codeExecutionModel.js -> tableName: 'code_executions'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS code_executions (
  execution_id        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  user_id             CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  language            VARCHAR(50)  NOT NULL,
  source_code         TEXT         NOT NULL,
  stdin               TEXT         NULL,
  status_description  VARCHAR(100) NULL,
  status_id           INT          NULL,
  stdout              TEXT         NULL,
  stderr              TEXT         NULL,
  compile_output      TEXT         NULL,
  execution_time      VARCHAR(20)  NULL,
  memory_used         VARCHAR(20)  NULL,
  room_code           VARCHAR(50)  NULL,
  createdAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (execution_id),
  KEY idx_code_exec_user (user_id),
  CONSTRAINT fk_code_exec_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. BUG REPORTS TABLE (User & Super Admin Bug Governance System)
-- Model: bugReportModel.js -> tableName: 'bug_reports'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bug_reports (
  bug_id              CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  user_id             CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  user_name           VARCHAR(255) NULL,
  user_email          VARCHAR(255) NULL,
  user_role           VARCHAR(50)  NULL DEFAULT 'candidate',
  title               VARCHAR(255) NOT NULL,
  description         TEXT         NOT NULL,
  category            VARCHAR(100) NULL DEFAULT 'General UI',
  severity            VARCHAR(50)  NULL DEFAULT 'medium',
  photo_url           TEXT         NULL,
  page_url            VARCHAR(255) NULL,
  status              VARCHAR(50)  NOT NULL DEFAULT 'open',
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (bug_id),
  KEY idx_bug_reports_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. SESSIONS TABLE (User Login Device & Node.js OS Sessions Audit)
-- Model: sessionModel.js -> tableName: 'sessions'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  session_id          CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (UUID()),
  user_id             CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  user_name           VARCHAR(255) NULL,
  user_email          VARCHAR(255) NULL,
  user_role           VARCHAR(50)  NULL DEFAULT 'candidate',
  ip_address          VARCHAR(100) NULL,
  user_agent          TEXT         NULL,
  server_hostname     VARCHAR(255) NULL,
  server_os           VARCHAR(255) NULL,
  login_time          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_time    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status              ENUM('active','terminated') NOT NULL DEFAULT 'active',
  createdAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id),
  KEY idx_sessions_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ALTER MIGRATION STATEMENTS (Safe updates for existing databases)
-- ============================================================================

-- 1. Users Table OTP & Reset Token Migration
ALTER TABLE users MODIFY COLUMN role ENUM('admin','interviewer','candidate','superAdmin') NOT NULL DEFAULT 'candidate';
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL AFTER is_active;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME NULL AFTER reset_token;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6) NULL AFTER reset_token_expires;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires DATETIME NULL AFTER otp_code;

-- 2. Interviewers Table Verification & Mentor Flags
ALTER TABLE interviewers ADD COLUMN IF NOT EXISTS specialization JSON NULL AFTER department;
ALTER TABLE interviewers ADD COLUMN IF NOT EXISTS availability JSON NULL AFTER specialization;
ALTER TABLE interviewers ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER availability;
ALTER TABLE interviewers ADD COLUMN IF NOT EXISTS is_mentor TINYINT(1) NOT NULL DEFAULT 1 AFTER is_verified;

-- 3. Companies Table Branding & Verification PDF
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT NULL AFTER contact_email;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS verification_doc VARCHAR(255) NULL AFTER logo_url;

-- 4. Candidates Table Resume & Skill Tags
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS resume_url TEXT NULL AFTER preferred_location;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills JSON NULL AFTER resume_url;

-- 5. Interview Requests Table Type, Slot & Meeting Link
ALTER TABLE interview_requests ADD COLUMN IF NOT EXISTS request_type ENUM('direct','open') NOT NULL DEFAULT 'direct' AFTER interviewer_user_id;
ALTER TABLE interview_requests ADD COLUMN IF NOT EXISTS scheduled_time VARCHAR(50) NULL AFTER scheduled_date;
ALTER TABLE interview_requests ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(255) NULL AFTER candidate_notes;
ALTER TABLE interview_requests MODIFY COLUMN interviewer_user_id CHAR(36) NULL;

SET FOREIGN_KEY_CHECKS = 1;
