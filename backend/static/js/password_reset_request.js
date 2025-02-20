document.addEventListener("DOMContentLoaded", function () {
    const resetForm = document.getElementById("password-reset-form");
    const messageBox = document.getElementById("password-reset-message");

    resetForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("reset-username").value.trim();
        const email = document.getElementById("reset-email").value.trim();

        if (!username || !email) {
            showMessage("All fields are required.", "error");
            return;
        }

        try {
            const response = await fetch("/auth/password-reset-request", { // ✅ Fixed endpoint
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email }),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message, "success");
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
