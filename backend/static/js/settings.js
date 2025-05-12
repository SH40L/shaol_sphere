document.addEventListener("DOMContentLoaded", () => {
  // 🔹 Tab Switching
  const tabLinks = document.querySelectorAll(".tab-link");
  const tabContents = document.querySelectorAll(".tab-content");

  tabLinks.forEach(link => {
    link.addEventListener("click", () => {
      const target = link.dataset.tab;

      // Remove active from all
      tabLinks.forEach(l => l.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      // Add active to current
      link.classList.add("active");
      document.getElementById(`tab-${target}`).classList.add("active");
    });
  });

  // 🔹 Image Preview
  const profileInput = document.querySelector('input[name="profile_image"]');
  const coverInput = document.querySelector('input[name="cover_image"]');
  const profilePreview = document.getElementById("profile-preview");
  const coverPreview = document.getElementById("cover-preview");

  if (profileInput) {
    profileInput.addEventListener("change", () => {
      const file = profileInput.files[0];
      if (file) profilePreview.src = URL.createObjectURL(file);
    });
  }

  if (coverInput) {
    coverInput.addEventListener("change", () => {
      const file = coverInput.files[0];
      if (file) coverPreview.src = URL.createObjectURL(file);
    });
  }

  // 🔹 Password Validation (AJAX Old Password Check)
  const passwordForm = document.getElementById("change-password-form");
  const passwordError = document.getElementById("password-error");

  passwordForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const oldPassword = passwordForm.old_password.value;
    const newPassword = passwordForm.new_password.value;
    const confirmPassword = passwordForm.confirm_password.value;

    passwordError.textContent = "";

    if (newPassword !== confirmPassword) {
      passwordError.textContent = "New passwords do not match.";
      return;
    }

    try {
      const res = await fetch("/settings/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: oldPassword })
      });

      const data = await res.json();
      if (!data.valid) {
        passwordError.textContent = "Old password is incorrect.";
        return;
      }

      // Submit form if everything is valid
      passwordForm.submit();
    } catch (err) {
      passwordError.textContent = "Something went wrong.";
    }
  });

  // 🔹 Delete Modal Logic
  const deleteModal = document.getElementById("delete-modal");
  const showDeleteBtn = document.getElementById("show-delete-modal");
  const cancelDeleteBtn = document.getElementById("cancel-delete");
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  const deletePasswordInput = document.getElementById("delete-password");
  const deleteError = document.getElementById("delete-error");

  if (showDeleteBtn && deleteModal) {
    showDeleteBtn.addEventListener("click", () => {
      deleteModal.classList.remove("hidden");
    });
  }

  cancelDeleteBtn?.addEventListener("click", () => {
    deleteModal.classList.add("hidden");
    deletePasswordInput.value = "";
    deleteError.textContent = "";
  });

  confirmDeleteBtn?.addEventListener("click", async () => {
    const password = deletePasswordInput.value;
    if (!password) {
      deleteError.textContent = "Password is required.";
      return;
    }

    try {
      const res = await fetch("/settings/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (data.success) {
        showToast("Account deleted successfully.");
        setTimeout(() => {
          window.location.href = "/auth/logout";
        }, 1500);
      } else {
        deleteError.textContent = data.message || "Failed to delete account.";
      }
    } catch (err) {
      deleteError.textContent = "Something went wrong.";
    }
  });
});

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, 1200);
}