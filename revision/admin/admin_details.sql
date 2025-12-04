CREATE TABLE
    admin_details (
        admin_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) DEFAULT NULL,
        avatar VARCHAR(255) DEFAULT NULL,
        -- 
        hashed VARCHAR(255) DEFAULT NULL,
        salt VARCHAR(255) DEFAULT NULL,
        -- 
        role ENUM ('super_admin', 'support_admin') DEFAULT 'support_admin',
        status ENUM ('active', 'inactive', 'suspended') DEFAULT 'active',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_visit TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    admin_roles (
        role_id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    role_permissions (
        admin_id BIGINT UNSIGNED,
        permission_id INT,
        can_view BOOLEAN DEFAULT FALSE,
        can_create BOOLEAN DEFAULT FALSE,
        can_update BOOLEAN DEFAULT FALSE,
        can_delete BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (admin_id, permission_id),
        FOREIGN KEY (admin_id) REFERENCES admin_details (admin_id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES admin_permissions (permission_id) ON DELETE CASCADE
    );

INSERT INTO
    role_permissions (
        admin_id,
        permission_id,
        can_view,
        can_create,
        can_update,
        can_delete
    )
VALUES
    (
        1, -- admin_id
        1, -- permission_id
        TRUE, -- can_view
        TRUE, -- can_create
        TRUE, -- can_update
        TRUE -- can_delete
    );

CREATE TABLE
    admin_permissions (
        permission_id INT AUTO_INCREMENT PRIMARY KEY,
        permission_key VARCHAR(100) NOT NULL UNIQUE,
        description TEXT DEFAULT NULL
    );

INSERT INTO
    admin_permissions (permission_key, description)
VALUES
    ('*', 'All access super admin')
    -- -- Dashboard
    -- ('dashboard', 'Access to the main dashboard'),
    -- -- User Management
    -- ('user-management', 'User Management root'),
    -- ('user-management.total-users', 'View total users'),
    -- (
    --     'user-management.active-users',
    --     'View active users'
    -- ),
    -- (
    --     'user-management.waitlist',
    --     'View waitlist signups'
    -- ),
    -- ('user-management.roles', 'Manage user roles'),
    -- (
    --     'user-management.suspensions',
    --     'Handle suspensions/bans'
    -- ),
    -- (
    --     'user-management.auth-logs',
    --     'View authentication logs'
    -- ),
    -- (
    --     'user-management.oauth',
    --     'Manage OAuth/Social Logins'
    -- ),
    -- -- Document Analytics
    -- ('document-analytics', 'Document Analytics root'),
    -- (
    --     'document-analytics.total-pdfs',
    --     'View total PDFs'
    -- ),
    -- (
    --     'document-analytics.active-docs',
    --     'View most active documents'
    -- ),
    -- (
    --     'document-analytics.failed-files',
    --     'View failed uploads'
    -- ),
    -- (
    --     'document-analytics.types-sizes',
    --     'Analyze file types and sizes'
    -- ),
    -- (
    --     'document-analytics.chat-usage',
    --     'View AI chat usage per document'
    -- ),
    -- (
    --     'document-analytics.trending',
    --     'View trending documents'
    -- ),
    -- (
    --     'document-analytics.tags',
    --     'Manage document category tags'
    -- ),
    -- -- AI Usage
    -- ('ai-usage', 'AI Usage Insights root'),
    -- ('ai-usage.total-queries', 'View total AI queries'),
    -- (
    --     'ai-usage.avg-queries',
    --     'View average queries per user'
    -- ),
    -- ('ai-usage.api-cost', 'Estimate API costs'),
    -- (
    --     'ai-usage.most-queried',
    --     'View most queried documents'
    -- ),
    -- (
    --     'ai-usage.performance',
    --     'Check latency and performance'
    -- ),
    -- ('ai-usage.errors', 'View failed queries'),
    -- -- Content Moderation
    -- ('content-moderation', 'Content Moderation root'),
    -- (
    --     'content-moderation.flagged',
    --     'View flagged content'
    -- ),
    -- (
    --     'content-moderation.sensitive',
    --     'AI-detected sensitive content'
    -- ),
    -- (
    --     'content-moderation.mod-queue',
    --     'Manual moderation queue'
    -- ),
    -- (
    --     'content-moderation.delete-docs',
    --     'Delete documents'
    -- ),
    -- (
    --     'content-moderation.review-user-content',
    --     'Review titles and tags'
    -- ),
    -- -- Search & Recommendations
    -- (
    --     'search-recommendation',
    --     'Search & Recommendation root'
    -- ),
    -- (
    --     'search-recommendation.top-searches',
    --     'View top searches'
    -- ),
    -- (
    --     'search-recommendation.zero-results',
    --     'Zero result search queries'
    -- ),
    -- (
    --     'search-recommendation.top-recommended',
    --     'Top recommended content'
    -- ),
    -- (
    --     'search-recommendation.ctr',
    --     'Click-through rate metrics'
    -- ),
    -- (
    --     'search-recommendation.personalization',
    --     'Personalization metrics'
    -- ),
    -- -- System & Server Health
    -- ('system-health', 'System & Server Health root'),
    -- ('system-health.api-volume', 'API call volume'),
    -- ('system-health.uptime', 'Uptime logs'),
    -- ('system-health.error-logs', 'System error logs'),
    -- (
    --     'system-health.queue-status',
    --     'Queue processing status'
    -- ),
    -- -- Revenue & Plans
    -- ('revenue', 'Revenue and Plans root'),
    -- (
    --     'revenue.plans',
    --     'Manage pricing plans and user subscriptions'
    -- ),
    -- ('revenue.stripe-logs', 'View Stripe payment logs'),
    -- ('revenue.mrr', 'View monthly recurring revenue'),
    -- (
    --     'revenue.conversion',
    --     'Trial-to-paid conversion metrics'
    -- ),
    -- (
    --     'revenue.coupons',
    --     'Manage and track coupon usage'
    -- ),
    -- -- Feedback & Support
    -- ('feedback', 'Feedback & Support root'),
    -- ('feedback.issues', 'View user-reported issues'),
    -- (
    --     'feedback.feature-requests',
    --     'Feature requests list'
    -- ),
    -- (
    --     'feedback.reviews',
    --     'Document ratings and reviews'
    -- ),
    -- (
    --     'feedback.chat-history',
    --     'User chat history with AI'
    -- ),
    -- -- Settings
    -- ('settings', 'Admin dashboard settings');