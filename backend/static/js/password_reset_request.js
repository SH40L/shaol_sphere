document.addEventListener("DOMContentLoaded", function () {
    const resetForm = document.getElementById("password-reset-form");
    const messageBox = document.getElementById("password-reset-message");
    const resetBtn = document.getElementById("reset-btn");

    resetForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("reset-username").value.trim();
        const email = document.getElementById("reset-email").value.trim();

        resetBtn.disabled = true;
        resetBtn.innerText = "Processing...";

        try {
            const response = await fetch("/auth/password-reset-request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email }),
            });

            const data = await response.json();

            if (data.error) {
                showMessage(data.error, "error");
                resetBtn.disabled = false;
                resetBtn.innerText = "Reset Password";
            } else {
                showMessage(data.message, "success");
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            }
        } catch (error) {
            showMessage("An error occurred while requesting password reset.", "error");
            resetBtn.disabled = false;
            resetBtn.innerText = "Reset Password";
        }
    });

    function showMessage(message, status) {
        messageBox.style.display = "block";
        messageBox.className = `message-box ${status}`;
        messageBox.innerText = message;
    }
});
