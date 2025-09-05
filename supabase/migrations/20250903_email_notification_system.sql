-- ============================================================
-- EMAIL NOTIFICATION SYSTEM SCHEMA
-- ============================================================
-- This migration creates all tables and functions required for
-- the email notification service with multi-tenant support
-- ============================================================

-- Email template types enum
CREATE TYPE email_template_type AS ENUM (
  'teacher_invitation',
  'password_reset',
  'welcome',
  'account_suspended',
  'account_reactivated',
  'system_maintenance',
  'system_update',
  'custom'
);

-- Email status enum
CREATE TYPE email_status AS ENUM (
  'pending',
  'queued',
  'sending',
  'sent',
  'delivered',
  'bounced',
  'failed',
  'cancelled'
);

-- Email priority enum
CREATE TYPE email_priority AS ENUM (
  'low',
  'normal',
  'high',
  'critical'
);

-- ============================================================
-- EMAIL TEMPLATES TABLE
-- ============================================================
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_type email_template_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Template content
  html_template TEXT NOT NULL,
  text_template TEXT,
  
  -- Template variables (JSON Schema)
  variables_schema JSONB DEFAULT '{}',
  
  -- Customization
  from_name VARCHAR(255),
  from_email VARCHAR(255),
  reply_to VARCHAR(255),
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  
  -- Unique constraint for system templates
  CONSTRAINT unique_system_template UNIQUE NULLS NOT DISTINCT (tenant_id, template_type)
);

-- Create index for template lookups
CREATE INDEX idx_email_templates_tenant_type ON email_templates(tenant_id, template_type);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

-- ============================================================
-- EMAIL QUEUE TABLE
-- ============================================================
CREATE TABLE email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Email details
  template_id UUID REFERENCES email_templates(id),
  template_type email_template_type NOT NULL,
  
  -- Recipients
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  cc_emails TEXT[],
  bcc_emails TEXT[],
  
  -- Content
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  
  -- Template variables
  template_variables JSONB DEFAULT '{}',
  
  -- Metadata
  from_email VARCHAR(255),
  from_name VARCHAR(255),
  reply_to VARCHAR(255),
  
  -- Status tracking
  status email_status DEFAULT 'pending',
  priority email_priority DEFAULT 'normal',
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  
  -- Processing
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- External provider tracking
  provider_message_id VARCHAR(255),
  provider_response JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  
  -- Reference to related entities
  related_entity_type VARCHAR(100),
  related_entity_id UUID
);

-- Indexes for email queue
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_tenant_status ON email_queue(tenant_id, status);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_email_queue_priority_status ON email_queue(priority DESC, status);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at DESC);

-- ============================================================
-- EMAIL LOGS TABLE (Historical record of all emails)
-- ============================================================
CREATE TABLE email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  queue_id UUID REFERENCES email_queue(id) ON DELETE SET NULL,
  
  -- Email details
  template_type email_template_type NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  
  -- Status
  status email_status NOT NULL,
  
  -- Provider tracking
  provider_message_id VARCHAR(255),
  provider_response JSONB,
  
  -- Delivery tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  
  -- Error information
  error_message TEXT,
  error_details JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for email logs
CREATE INDEX idx_email_logs_tenant ON email_logs(tenant_id);
CREATE INDEX idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX idx_email_logs_provider_message_id ON email_logs(provider_message_id);

-- ============================================================
-- EMAIL BLACKLIST TABLE (Prevent sending to specific emails)
-- ============================================================
CREATE TABLE email_blacklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  reason VARCHAR(500),
  blacklisted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  blacklisted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT unique_tenant_email_blacklist UNIQUE(tenant_id, email)
);

CREATE INDEX idx_email_blacklist_email ON email_blacklist(email);
CREATE INDEX idx_email_blacklist_tenant ON email_blacklist(tenant_id);

-- ============================================================
-- EMAIL RATE LIMITS TABLE
-- ============================================================
CREATE TABLE email_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Limits
  hourly_limit INT DEFAULT 100,
  daily_limit INT DEFAULT 1000,
  monthly_limit INT DEFAULT 10000,
  
  -- Current usage
  hourly_count INT DEFAULT 0,
  daily_count INT DEFAULT 0,
  monthly_count INT DEFAULT 0,
  
  -- Reset timestamps
  hourly_reset_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 hour',
  daily_reset_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 day',
  monthly_reset_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 month',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_tenant_rate_limit UNIQUE(tenant_id)
);

-- ============================================================
-- EMAIL WEBHOOKS TABLE (Track webhook events from provider)
-- ============================================================
CREATE TABLE email_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  message_id VARCHAR(255),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_webhooks_message_id ON email_webhooks(message_id);
CREATE INDEX idx_email_webhooks_processed ON email_webhooks(processed);
CREATE INDEX idx_email_webhooks_received_at ON email_webhooks(received_at DESC);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to check if email is blacklisted
CREATE OR REPLACE FUNCTION is_email_blacklisted(
  p_tenant_id UUID,
  p_email VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_blacklist
    WHERE (tenant_id = p_tenant_id OR tenant_id IS NULL)
    AND email = p_email
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_email_rate_limit(
  p_tenant_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_rate_limit email_rate_limits%ROWTYPE;
BEGIN
  -- Get or create rate limit record
  INSERT INTO email_rate_limits (tenant_id)
  VALUES (p_tenant_id)
  ON CONFLICT (tenant_id) DO NOTHING;
  
  SELECT * INTO v_rate_limit
  FROM email_rate_limits
  WHERE tenant_id = p_tenant_id
  FOR UPDATE;
  
  -- Reset counters if needed
  IF v_rate_limit.hourly_reset_at <= CURRENT_TIMESTAMP THEN
    UPDATE email_rate_limits
    SET hourly_count = 0,
        hourly_reset_at = CURRENT_TIMESTAMP + INTERVAL '1 hour'
    WHERE tenant_id = p_tenant_id;
    v_rate_limit.hourly_count := 0;
  END IF;
  
  IF v_rate_limit.daily_reset_at <= CURRENT_TIMESTAMP THEN
    UPDATE email_rate_limits
    SET daily_count = 0,
        daily_reset_at = CURRENT_TIMESTAMP + INTERVAL '1 day'
    WHERE tenant_id = p_tenant_id;
    v_rate_limit.daily_count := 0;
  END IF;
  
  IF v_rate_limit.monthly_reset_at <= CURRENT_TIMESTAMP THEN
    UPDATE email_rate_limits
    SET monthly_count = 0,
        monthly_reset_at = CURRENT_TIMESTAMP + INTERVAL '1 month'
    WHERE tenant_id = p_tenant_id;
    v_rate_limit.monthly_count := 0;
  END IF;
  
  -- Check limits
  IF v_rate_limit.hourly_count >= v_rate_limit.hourly_limit OR
     v_rate_limit.daily_count >= v_rate_limit.daily_limit OR
     v_rate_limit.monthly_count >= v_rate_limit.monthly_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counters
  UPDATE email_rate_limits
  SET hourly_count = hourly_count + 1,
      daily_count = daily_count + 1,
      monthly_count = monthly_count + 1
  WHERE tenant_id = p_tenant_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue an email
CREATE OR REPLACE FUNCTION queue_email(
  p_tenant_id UUID,
  p_template_type email_template_type,
  p_to_email VARCHAR,
  p_template_variables JSONB DEFAULT '{}',
  p_priority email_priority DEFAULT 'normal',
  p_scheduled_for TIMESTAMPTZ DEFAULT NULL,
  p_related_entity_type VARCHAR DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_template email_templates%ROWTYPE;
  v_email_id UUID;
  v_subject TEXT;
  v_html_content TEXT;
  v_text_content TEXT;
BEGIN
  -- Check if email is blacklisted
  IF is_email_blacklisted(p_tenant_id, p_to_email) THEN
    RAISE EXCEPTION 'Email % is blacklisted', p_to_email;
  END IF;
  
  -- Check rate limits
  IF NOT check_email_rate_limit(p_tenant_id) THEN
    RAISE EXCEPTION 'Email rate limit exceeded for tenant';
  END IF;
  
  -- Get template
  SELECT * INTO v_template
  FROM email_templates
  WHERE tenant_id = p_tenant_id
    AND template_type = p_template_type
    AND is_active = true
  LIMIT 1;
  
  IF v_template IS NULL THEN
    -- Try system template
    SELECT * INTO v_template
    FROM email_templates
    WHERE tenant_id IS NULL
      AND template_type = p_template_type
      AND is_active = true
      AND is_system_template = true
    LIMIT 1;
  END IF;
  
  IF v_template IS NULL THEN
    RAISE EXCEPTION 'No active template found for type %', p_template_type;
  END IF;
  
  -- Process template (simplified - in reality would use template engine)
  v_subject := v_template.subject;
  v_html_content := v_template.html_template;
  v_text_content := v_template.text_template;
  
  -- Insert into queue
  INSERT INTO email_queue (
    tenant_id,
    template_id,
    template_type,
    to_email,
    subject,
    html_content,
    text_content,
    template_variables,
    from_email,
    from_name,
    reply_to,
    priority,
    scheduled_for,
    related_entity_type,
    related_entity_id,
    created_by
  ) VALUES (
    p_tenant_id,
    v_template.id,
    p_template_type,
    p_to_email,
    v_subject,
    v_html_content,
    v_text_content,
    p_template_variables,
    v_template.from_email,
    v_template.from_name,
    v_template.reply_to,
    p_priority,
    p_scheduled_for,
    p_related_entity_type,
    p_related_entity_id,
    auth.uid()
  ) RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process webhook events
CREATE OR REPLACE FUNCTION process_email_webhook(
  p_provider VARCHAR,
  p_event_type VARCHAR,
  p_message_id VARCHAR,
  p_payload JSONB
) RETURNS VOID AS $$
DECLARE
  v_email_log email_logs%ROWTYPE;
BEGIN
  -- Store webhook
  INSERT INTO email_webhooks (provider, event_type, message_id, payload)
  VALUES (p_provider, p_event_type, p_message_id, p_payload);
  
  -- Update email log based on event type
  IF p_message_id IS NOT NULL THEN
    SELECT * INTO v_email_log
    FROM email_logs
    WHERE provider_message_id = p_message_id
    LIMIT 1;
    
    IF v_email_log IS NOT NULL THEN
      CASE p_event_type
        WHEN 'delivered' THEN
          UPDATE email_logs
          SET status = 'delivered',
              delivered_at = CURRENT_TIMESTAMP
          WHERE id = v_email_log.id;
        WHEN 'opened' THEN
          UPDATE email_logs
          SET opened_at = CURRENT_TIMESTAMP
          WHERE id = v_email_log.id;
        WHEN 'clicked' THEN
          UPDATE email_logs
          SET clicked_at = CURRENT_TIMESTAMP
          WHERE id = v_email_log.id;
        WHEN 'bounced' THEN
          UPDATE email_logs
          SET status = 'bounced',
              bounced_at = CURRENT_TIMESTAMP,
              error_message = p_payload->>'reason'
          WHERE id = v_email_log.id;
        ELSE
          -- Handle other events
          NULL;
      END CASE;
    END IF;
  END IF;
  
  -- Mark webhook as processed
  UPDATE email_webhooks
  SET processed = true,
      processed_at = CURRENT_TIMESTAMP
  WHERE message_id = p_message_id
    AND event_type = p_event_type
    AND provider = p_provider;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_rate_limits ENABLE ROW LEVEL SECURITY;

-- Email templates policies
CREATE POLICY "Tenant admins can manage email templates"
  ON email_templates
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants
      WHERE user_id = auth.uid()
      AND role_id IN (
        SELECT id FROM roles WHERE name IN ('platform_admin', 'tenant_admin')
      )
      AND status = 'active'
    )
  );

-- Email queue policies
CREATE POLICY "Users can view their tenant's email queue"
  ON email_queue
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can manage email queue"
  ON email_queue
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants
      WHERE user_id = auth.uid()
      AND role_id IN (
        SELECT id FROM roles WHERE name IN ('platform_admin', 'tenant_admin')
      )
      AND status = 'active'
    )
  );

-- Email logs policies
CREATE POLICY "Users can view their tenant's email logs"
  ON email_logs
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Email blacklist policies
CREATE POLICY "Tenant admins can manage email blacklist"
  ON email_blacklist
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants
      WHERE user_id = auth.uid()
      AND role_id IN (
        SELECT id FROM roles WHERE name IN ('platform_admin', 'tenant_admin')
      )
      AND status = 'active'
    )
  );

-- Email rate limits policies
CREATE POLICY "Tenant admins can view rate limits"
  ON email_rate_limits
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants
      WHERE user_id = auth.uid()
      AND role_id IN (
        SELECT id FROM roles WHERE name IN ('platform_admin', 'tenant_admin')
      )
      AND status = 'active'
    )
  );

-- ============================================================
-- DEFAULT SYSTEM EMAIL TEMPLATES
-- ============================================================

-- Teacher invitation template
INSERT INTO email_templates (
  tenant_id,
  template_type,
  name,
  subject,
  description,
  html_template,
  text_template,
  variables_schema,
  is_system_template
) VALUES (
  NULL,
  'teacher_invitation',
  'Teacher Invitation',
  'You''ve been invited to join {{tenant_name}} on Gemeos',
  'Default template for inviting teachers to join a tenant',
  '<h1>Welcome to {{tenant_name}}!</h1><p>You''ve been invited to join as a teacher.</p><a href="{{invite_link}}">Accept Invitation</a>',
  'Welcome to {{tenant_name}}! You''ve been invited to join as a teacher. Click here to accept: {{invite_link}}',
  '{"tenant_name": "string", "invite_link": "string", "inviter_name": "string"}',
  true
);

-- Password reset template
INSERT INTO email_templates (
  tenant_id,
  template_type,
  name,
  subject,
  description,
  html_template,
  text_template,
  variables_schema,
  is_system_template
) VALUES (
  NULL,
  'password_reset',
  'Password Reset',
  'Reset your Gemeos password',
  'Default template for password reset emails',
  '<h1>Password Reset Request</h1><p>Click the link below to reset your password:</p><a href="{{reset_link}}">Reset Password</a><p>This link will expire in 1 hour.</p>',
  'Password Reset Request. Click here to reset your password: {{reset_link}}. This link will expire in 1 hour.',
  '{"reset_link": "string", "user_name": "string"}',
  true
);

-- Welcome email template
INSERT INTO email_templates (
  tenant_id,
  template_type,
  name,
  subject,
  description,
  html_template,
  text_template,
  variables_schema,
  is_system_template
) VALUES (
  NULL,
  'welcome',
  'Welcome Email',
  'Welcome to Gemeos!',
  'Default welcome email for new users',
  '<h1>Welcome to Gemeos!</h1><p>Your account has been created successfully.</p><p>Get started by <a href="{{login_link}}">logging in</a>.</p>',
  'Welcome to Gemeos! Your account has been created successfully. Get started by logging in: {{login_link}}',
  '{"user_name": "string", "login_link": "string"}',
  true
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_rate_limits_updated_at
  BEFORE UPDATE ON email_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();