document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("password-reset-form");
    const messageBox = document.getElementById("password-reset-message");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("reset-username").value.trim();
        const email = document.getElementById("reset-email").value.trim();

        if (!username || !email) {
            showMessage("Please fill in all fields.", "error");
            return;
        }

        try {
            console.log("Sending request to /auth/password-reset-request...");

            const response = await fetch("/auth/password-reset-request", {  // ✅ Updated route
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email })
            });

            const text = await response.text();  // Get raw response
            console.log("Raw response:", text);

            let result;
            try {
                result = JSON.parse(text);
            } catch (err) {
                console.error("Failed to parse JSON:", err);
                showMessage("Server error. Please try again later.", "error");
                return;
            }

            console.log("Response received:", result);

            if (result.success) {
                showMessage(result.message, "success");
                form.reset();
            } else {
                showMessage(result.message || "An error occurred.", "error");
            }
        } catch (error) {
            console.error("Error:", error);
            showMessage("Something went wrong. Check console for details.", "error");
        }
    });

    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = "block";
    }
});
