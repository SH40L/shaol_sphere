document.addEventListener("DOMContentLoaded", function () {
    // Populate Days
    const daySelect = document.getElementById("day");
    for (let i = 1; i <= 31; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }

    // Populate Years (from current year back to 1900)
    const yearSelect = document.getElementById("year");
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1900; i--) {
        let option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }

    // Handle Registration Form Submission
    document.getElementById("register-page-form").addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent default form submission

        // Collect form data
        const username = document.getElementById("register-username").value.trim();
        const full_name = document.getElementById("register-name").value.trim();
        const day = document.getElementById("day").value;
        const month = document.getElementById("month").value;
        const year = document.getElementById("year").value;
        const gender = document.querySelector('input[name="gender"]:checked')?.value || ""; // Fixed Gender Selection
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value.trim();

        // Validate all fields
        if (!username || !full_name || !day || !month || !year || !gender || !email || !password) {
            alert("All fields are required!");
            return;
        }

        // Format Date of Birth (YYYY-MM-DD)
        const date_of_birth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Prepare data for API request
        const userData = {
            username,
            full_name,
            date_of_birth,
            gender,
            email,
            password
        };

        try {
            const response = await fetch("/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                window.location.href = "/login"; // Redirect to login page
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
        }
    });
});
