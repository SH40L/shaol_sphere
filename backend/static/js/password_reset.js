document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("password-reset-form");
    const messageBox = document.getElementById("password-reset-message");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const newPassword = document.getElementById("new-password").value.trim();
        const confirmPassword = document.getElementById("confirm-password").value.trim();

        if (!newPassword || !confirmPassword) {
            showMessage("Please fill in all fields.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage("Passwords do not match.", "error");
            return;
        }

        const token = new URLSearchParams(window.location.search).get("token");

        const response = await fetch(`/reset-password?token=${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: newPassword })
        });

        const result = await response.json();
        showMessage(result.message, result.success ? "success" : "error");

        if (result.success) {
            setTimeout(() => window.location.href = "/login", 2000);
        }
    });

    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = "block";
    }
});
