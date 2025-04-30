document.addEventListener("DOMContentLoaded", function () {
    const resetForm = document.getElementById("password-reset-form");
    const messageBox = document.getElementById("password-reset-message");
    const updateBtn = document.getElementById("update-btn");

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
        sessionStorage.setItem("password_reset_token", token);

        showMessage("Verifying link, please wait...", "info");

        fetch("/auth/check-reset-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                window.location.href = "/login?message=" + encodeURIComponent(data.error) + "&status=error";
            } else {
                showMessage("Email verified. Please enter a new password.", "success");
            }
        })
        .catch(error => {
            console.error("Token check failed:", error);
            window.location.href = "/login?message=Something went wrong.&status=error";
        });
    } else {
        showMessage("Invalid or expired session. Please request a new reset link.", "error");
        resetForm.style.display = "none";
    }

    resetForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const newPassword = document.getElementById("new-password").value.trim();
        const confirmPassword = document.getElementById("confirm-password").value.trim();
        const storedToken = sessionStorage.getItem("password_reset_token");

        if (!storedToken) {
            showMessage("Invalid or expired token. Please request a new reset link.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage("Passwords do not match.", "error");
            return;
        }

        updateBtn.disabled = true;
        updateBtn.innerText = "Updating...";

        try {
            const response = await fetch("/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token: storedToken, new_password: newPassword }),
            });

            const data = await response.json();

            if (data.error) {
                showMessage(data.error, "error");
                updateBtn.disabled = false;
                updateBtn.innerText = "Update Password";
            } else {
                showMessage(data.message, "success");
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            }
        } catch (error) {
            showMessage("An error occurred while resetting your password.", "error");
            updateBtn.disabled = false;
            updateBtn.innerText = "Update Password";
        }
    });

    function showMessage(message, status) {
        messageBox.style.display = "block";
        messageBox.className = `message-box ${status}`;
        messageBox.innerText = message;
    }
});
