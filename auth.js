(() => {
  const usersStorageKey = "diamond-users";
  const sessionStorageKey = "diamond-authenticated-email";
  const currentPage = window.location.pathname.toLowerCase();
  const authMessage = document.querySelector("#auth-message");
  const recoveryLink = document.querySelector("#auth-recovery-link");
  const recoveryPrompt = document.querySelector("#auth-recovery");

  const showMessage = (message) => {
    if (authMessage) authMessage.textContent = message;
  };

  const registerEmail = new URLSearchParams(window.location.search).get("email");
  const registerEmailInput = document.querySelector("#register-form #email");
  if (registerEmail && registerEmailInput) {
    registerEmailInput.value = registerEmail;
    showMessage("This email was not found on this site. Create the account here with your password, then log in.");
  }

  if (currentPage.endsWith("/menu.html") || currentPage.endsWith("/product.html")) {
    if (!sessionStorage.getItem(sessionStorageKey)) {
      window.location.replace("login.html");
    }
    return;
  }

  const bytesToHex = (bytes) =>
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  const hashPassword = async (password, salt) => {
    if (!window.crypto?.subtle) {
      throw new Error("Secure password hashing is unavailable. Open the site through localhost or HTTPS.");
    }

    const data = new TextEncoder().encode(`${salt}:${password}`);
    const hash = await window.crypto.subtle.digest("SHA-256", data);
    return bytesToHex(new Uint8Array(hash));
  };

  const readUsers = () => {
    const storedUsers = localStorage.getItem(usersStorageKey);
    if (!storedUsers) return {};

    const users = JSON.parse(storedUsers);
    if (!users || typeof users !== "object" || Array.isArray(users)) {
      throw new Error("Saved account data is invalid. Clear the site's saved data and register again.");
    }
    return users;
  };

  const createSalt = () => {
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    return bytesToHex(bytes);
  };

  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      showMessage("");

      const email = loginForm.querySelector("#email").value.trim().toLowerCase();
      const password = loginForm.querySelector("#password").value;

      try {
        const user = readUsers()[email];
        if (!user) {
          showMessage("No account was found on this site. If you registered elsewhere, create it here to use this site.");
          if (recoveryLink && recoveryPrompt) {
            recoveryLink.href = `register.HTML?email=${encodeURIComponent(email)}`;
            recoveryPrompt.hidden = false;
          }
          return;
        }
        if ((await hashPassword(password, user.salt)) !== user.passwordHash) {
          showMessage("Access denied. Check your email and password.");
          return;
        }

        sessionStorage.setItem(sessionStorageKey, email);
        window.location.assign("menu.html");
      } catch (error) {
        showMessage(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
      }
    });
  }

  const registerForm = document.querySelector("#register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      showMessage("");

      const email = registerForm.querySelector("#email").value.trim().toLowerCase();
      const password = registerForm.querySelector("#password").value;
      const confirmPassword = registerForm.querySelector("#confirm-password").value;

      if (password !== confirmPassword) {
        showMessage("Passwords do not match.");
        return;
      }

      try {
        const users = readUsers();
        if (users[email]) {
          showMessage("An account with this email already exists. Please log in.");
          return;
        }

        const salt = createSalt();
        users[email] = {
          salt,
          passwordHash: await hashPassword(password, salt)
        };
        localStorage.setItem(usersStorageKey, JSON.stringify(users));
        sessionStorage.setItem(sessionStorageKey, email);
        window.location.assign("menu.html");
      } catch (error) {
        showMessage(error instanceof Error ? error.message : "Unable to create the account. Please try again.");
      }
    });
  }
})();
