export const STORAGE_KEYS = {
  MESSAGES: 'glyphbot_messages',
  SETTINGS: 'glyphbot_settings',
  CHAT_COUNT: 'glyphbot_chat_count',
  PROVIDER_META: 'glyphbot_provider_meta'
};

export const LIMITS = {
  MAX_MESSAGES: 10,
  SAVE_SETTINGS_THRESHOLD: 20
};

export const PROVIDER_PRIORITY = ['PUTER', 'GEMINI', 'OPENAI', 'CLAUDE', 'OPENROUTER', 'LOCAL_OSS'];

export const WELCOME_MESSAGE = {
  id: 'welcome-1',
  role: 'assistant',
  content: `Hi, I'm GlyphBot — what would you like me to do?`,
  audit: null
};

export default { STORAGE_KEYS, LIMITS, PROVIDER_PRIORITY, WELCOME_MESSAGE };