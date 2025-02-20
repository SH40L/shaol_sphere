document.addEventListener("DOMContentLoaded", function () {
    populateDays();
    populateYears();

    // Handle Registration Form Submission
    document.getElementById("register-page-form").addEventListener("submit", handleFormSubmit);
});

/**
 * Populates the day dropdown with options from 1 to 31.
 */
function populateDays() {
    const daySelect = document.getElementById("day");
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }
}

/**
 * Populates the year dropdown with options from the current year down to 1900.
 */
function populateYears() {
    const yearSelect = document.getElementById("year");
    const currentYear = new Date().getFullYear();
    
    for (let i = currentYear; i >= 1900; i--) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
}

/**
 * Handles the form submission event.
 * @param {Event} event - The form submission event.
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    const messageBox = document.getElementById("register-message");
    messageBox.style.display = "none"; // Hide message initially

    // Collect form data
    const username = document.getElementById("register-username").value.trim();
    const fullName = document.getElementById("register-name").value.trim();
    const day = document.getElementById("day").value;
    const month = document.getElementById("month").value.padStart(2, '0');
    const year = document.getElementById("year").value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value || "";
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();

    // Validate all fields
    if (!username || !fullName || !day || !month || !year || !gender || !email || !password) {
        showMessage("All fields are required!", "error");
        return;
    }

    // Format Date of Birth (YYYY-MM-DD)
    const dateOfBirth = `${year}-${month}-${day.padStart(2, '0')}`;

    // Prepare data for API request
    const userData = { username, full_name: fullName, date_of_birth: dateOfBirth, gender, email, password };

    try {
        const response = await fetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        const result = await response.json();
        
        if (response.ok) {
            // Show success message and prompt user to verify email
            showMessage(result.message, "success");

            setTimeout(() => {
                window.location.href = "/login"; // Redirect to login page
            }, 3000);
        } else {
            showMessage(result.error, "error");
        }
    } catch (error) {
        showMessage("Something went wrong. Please try again.", "error");
    }
}

/**
 * Displays a message to the user.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('error' or 'success').
 */
function showMessage(message, type) {
    const messageBox = document.getElementById("register-message");
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = "block";
}
