document.addEventListener("DOMContentLoaded", function () {
    const messageBox = document.getElementById("login-message");

    // ✅ Show message from URL
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get("message");
    const status = urlParams.get("status");

    if (message) {
        showMessage(message, status || "info");
    }

    // ✅ Show message from sessionStorage (e.g., after registration)
    const storedMessage = sessionStorage.getItem("loginMessage");
    if (storedMessage) {
        showMessage(storedMessage, "success");
        sessionStorage.removeItem("loginMessage");
    }

    // ✅ Login form submission handler
    document.getElementById("login-page-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        messageBox.style.display = "none";

        const loginBtn = document.getElementById("login-btn");
        loginBtn.disabled = true;
        loginBtn.innerText = "Logging in...";

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();

        if (!email || !password) {
            showMessage("Email and password are required!", "error");
            loginBtn.disabled = false;
            loginBtn.innerText = "Login";
            return;
        }

        try {
            const response = await fetch("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (response.ok && result.token) {
                // ✅ Store token in sessionStorage (optional for frontend access)
                sessionStorage.setItem("jwt_token", result.token);

                // ✅ Send token to backend to store in Flask session
                await fetch("/auth/store-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: result.token }),
                });

                // ✅ Redirect based on backend's response
                window.location.href = result.redirect_url || "/";
            } else {
                showMessage(result.error || "Login failed.", "error");
                loginBtn.disabled = false;
                loginBtn.innerText = "Login";
            }
        } catch (error) {
            showMessage("Something went wrong. Please try again.", "error");
            loginBtn.disabled = false;
            loginBtn.innerText = "Login";
        }
    });

    // ✅ Show message box with styling
    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = "block";
    }
});
