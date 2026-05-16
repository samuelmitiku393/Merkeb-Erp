/**
 * Telegram Web App SDK utility service
 *
 * Provides a typed, safe interface to window.Telegram.WebApp.
 * All functions gracefully handle the case where the app is
 * running outside of Telegram (e.g. in a regular browser).
 */

// ─── Type declarations for the Telegram Web App SDK ─────────────────────────
// The SDK is loaded via the <script> tag in index.html, so we declare
// the global interface here to keep TypeScript happy.

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

export interface WebAppInitData {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: TelegramUser;
          auth_date?: number;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: TelegramThemeParams;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (ok: boolean) => void) => void;
        showPopup: (params: object, callback?: (buttonId: string) => void) => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

// ─── Core helpers ────────────────────────────────────────────────────────────

/** Returns true when the app is running inside the Telegram client */
export const isTelegramWebApp = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    !!window.Telegram?.WebApp?.initData &&
    window.Telegram.WebApp.initData.length > 0
  );
};

/** Returns the raw initData string to send to the backend for validation */
export const getInitData = (): string => {
  return window.Telegram?.WebApp?.initData ?? '';
};

/** Returns the already-parsed (but UNVERIFIED) user object from initData */
export const getTelegramUser = (): TelegramUser | null => {
  return window.Telegram?.WebApp?.initDataUnsafe?.user ?? null;
};

/** Returns the Telegram color scheme ('light' | 'dark') */
export const getColorScheme = (): 'light' | 'dark' => {
  return window.Telegram?.WebApp?.colorScheme ?? 'light';
};

/** Returns Telegram's theme parameters to sync with the MUI theme */
export const getThemeParams = (): TelegramThemeParams => {
  return window.Telegram?.WebApp?.themeParams ?? {};
};

// ─── Lifecycle helpers ───────────────────────────────────────────────────────

/** Signals Telegram that the app is ready (hides the loading indicator) */
export const notifyReady = (): void => {
  window.Telegram?.WebApp?.ready();
};

/** Expands the Mini App to the full available viewport height */
export const expandViewport = (): void => {
  window.Telegram?.WebApp?.expand();
};

/** Enable haptic feedback – safe to call even outside Telegram */
export const hapticImpact = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium'): void => {
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
};

export const hapticNotification = (type: 'error' | 'success' | 'warning'): void => {
  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
};

// ─── Main/Back Button convenience wrappers ───────────────────────────────────

export const showMainButton = (text: string, onClick: () => void): void => {
  const btn = window.Telegram?.WebApp?.MainButton;
  if (!btn) return;
  btn.setText(text);
  btn.onClick(onClick);
  btn.show();
};

export const hideMainButton = (): void => {
  window.Telegram?.WebApp?.MainButton?.hide();
};

export const showBackButton = (onClick: () => void): void => {
  const btn = window.Telegram?.WebApp?.BackButton;
  if (!btn) return;
  btn.onClick(onClick);
  btn.show();
};

export const hideBackButton = (): void => {
  window.Telegram?.WebApp?.BackButton?.hide();
};
