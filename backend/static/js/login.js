document.addEventListener("DOMContentLoaded", function () {
    // Handle Login Form Submission
    document.getElementById("login-page-form").addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent default form submission

        // Collect form data
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();

        // Validate fields
        if (!email || !password) {
            alert("Email and password are required!");
            return;
        }

        // Prepare data for API request
        const loginData = { email, password };

        try {
            const response = await fetch("/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                window.location.href = "/"; // Redirect to homepage or feed
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
        }
    });
});
