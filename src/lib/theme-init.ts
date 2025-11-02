/**
 * Initializes theme before page render to prevent flash of incorrect theme.
 * This script runs synchronously in the <head> section before any content renders.
 */
export const themeInitScript = `
(function() {
  try {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = storedTheme === "dark" || (!storedTheme && prefersDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {
    // Fallback to light theme if localStorage is not available
    document.documentElement.classList.remove("dark");
  }
})();
`;
