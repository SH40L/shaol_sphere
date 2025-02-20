document.addEventListener("DOMContentLoaded", function () {
    const resetForm = document.getElementById("password-reset-form");
    const messageBox = document.getElementById("password-reset-message");

    // ✅ Extract token from URL and store in sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
        sessionStorage.setItem("password_reset_token", token);
        showMessage("Email verified. Please enter a new password.", "success");
    } else {
        showMessage("Invalid or expired session. Please request a new reset link.", "error");
        resetForm.style.display = "none";
    }

    resetForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const newPassword = document.getElementById("new-password").value.trim();
        const confirmPassword = document.getElementById("confirm-password").value.trim();
        const storedToken = sessionStorage.getItem("password_reset_token");

        if (!newPassword || !confirmPassword) {
            showMessage("All fields are required.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage("Passwords do not match.", "error");
            return;
        }

        if (!storedToken) {
            showMessage("Invalid or expired session. Please request a new reset link.", "error");
            return;
        }

        try {
            const response = await fetch("/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: storedToken, new_password: newPassword }) // ✅ Fix field name
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message, "success");
                sessionStorage.removeItem("password_reset_token");

                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } else {
                showMessage(data.error, "error");
            }
        } catch (error) {
            showMessage("Something went wrong. Please try again.", "error");
        }
    });

    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = "block";
    }
});
