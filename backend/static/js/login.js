document.addEventListener("DOMContentLoaded", function () {
    const messageBox = document.getElementById("login-message");

    // ✅ Check for success/error messages in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get("message");
    const status = urlParams.get("status");

    if (message) {
        showMessage(message, status || "info");
    }

    // ✅ Check if there is a stored success message (from registration or password reset)
    const storedMessage = sessionStorage.getItem("loginMessage");
    if (storedMessage) {
        showMessage(storedMessage, "success");
        sessionStorage.removeItem("loginMessage");
    }

    // Handle Login Form Submission
    document.getElementById("login-page-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        messageBox.style.display = "none"; // Hide message initially

        // Collect form data
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();

        // Validate fields
        if (!email || !password) {
            showMessage("Email and password are required!", "error");
            return;
        }

        // Prepare data for API request
        const loginData = { email, password };

        try {
            const response = await fetch("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });

            const result = await response.json();
            if (response.ok) {
                // ✅ Store JWT securely in HttpOnly cookie (handled by the backend)
                // ✅ Redirect user to the homepage
                window.location.href = "/";
            } else {
                showMessage(result.error, "error");
            }
        } catch (error) {
            showMessage("Something went wrong. Please try again.", "error");
        }
    });

    /**
     * Displays a message to the user.
     * @param {string} message - The message to display.
     * @param {string} type - The type of message ('error' or 'success').
     */
    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = "block";
    }
});
