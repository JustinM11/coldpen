// Writing defaults (tone, sender name, signature, notification prefs) live in
// localStorage. Shared by SettingsPage (writes) and GeneratePage (reads).
export const DEFAULTS_KEY = "coldpen-writing-defaults";

export function loadWritingDefaults() {
  try {
    return JSON.parse(localStorage.getItem(DEFAULTS_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveWritingDefaults(defaults) {
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
}
