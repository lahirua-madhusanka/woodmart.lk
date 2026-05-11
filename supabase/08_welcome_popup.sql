-- Welcome Popup Settings
-- Stores a single row of popup configuration managed by admin.

CREATE TABLE IF NOT EXISTS welcome_popup_settings (
  id         BOOLEAN PRIMARY KEY DEFAULT TRUE,
  CONSTRAINT welcome_popup_settings_singleton CHECK (id = TRUE),

  is_active      BOOLEAN      NOT NULL DEFAULT FALSE,
  title          TEXT         NOT NULL DEFAULT '🎉 Welcome to Woodmart.lk',
  description    TEXT         NOT NULL DEFAULT 'Create your account today and unlock your exclusive first-order discount.',
  coupon_code    TEXT         NOT NULL DEFAULT 'WMWEL20',
  button_text    TEXT         NOT NULL DEFAULT 'Register Now',
  image_url      TEXT,
  delay_seconds  INTEGER      NOT NULL DEFAULT 4,

  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed default row
INSERT INTO welcome_popup_settings (id)
VALUES (TRUE)
ON CONFLICT (id) DO NOTHING;
