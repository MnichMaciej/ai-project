/**
 * Initializes header interactions: logout button and user menu dropdown
 */
export function initializeHeaderInteractions(): void {
  initializeLogoutButton();
  initializeUserMenuDropdown();
}

/**
 * Handles logout button click event
 */
function initializeLogoutButton(): void {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
        });

        if (response.ok || response.redirected) {
          window.location.href = "/auth/login";
        } else {
          console.error("Logout failed");
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    });
  }
}

/**
 * Handles user menu dropdown show/hide on hover
 */
function initializeUserMenuDropdown(): void {
  const userMenuTrigger = document.getElementById("user-menu-trigger");
  const userMenuDropdown = document.getElementById("user-menu-dropdown");

  if (userMenuTrigger && userMenuDropdown) {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const showDropdown = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      userMenuDropdown.classList.remove("opacity-0", "invisible");
      userMenuDropdown.classList.add("opacity-100", "visible");
    };

    const hideDropdown = () => {
      timeout = setTimeout(() => {
        userMenuDropdown.classList.remove("opacity-100", "visible");
        userMenuDropdown.classList.add("opacity-0", "invisible");
      }, 100);
    };

    userMenuTrigger.addEventListener("mouseenter", showDropdown);
    userMenuTrigger.addEventListener("mouseleave", hideDropdown);
    userMenuDropdown.addEventListener("mouseenter", showDropdown);
    userMenuDropdown.addEventListener("mouseleave", hideDropdown);
  }
}
