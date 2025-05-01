// complete_profile.js
document.addEventListener("DOMContentLoaded", function () {
  const profileInput = document.getElementById("profile_pic");
  const coverInput = document.getElementById("cover_image");
  const profilePreview = document.getElementById("profile_preview");
  const coverPreview = document.getElementById("cover_preview");
  const form = document.getElementById("complete-profile-form");

  // Show image previews
  profileInput.addEventListener("change", function () {
    const file = profileInput.files[0];
    if (file) {
      profilePreview.src = URL.createObjectURL(file);
      profilePreview.style.display = "block";
    }
  });

  coverInput.addEventListener("change", function () {
    const file = coverInput.files[0];
    if (file) {
      coverPreview.src = URL.createObjectURL(file);
      coverPreview.style.display = "block";
    }
  });

  // Track which button was clicked
  let clickedButton = null;
  document.querySelectorAll("#complete-profile-form button").forEach(btn => {
    btn.addEventListener("click", () => {
      clickedButton = btn.name;
    });
  });

  // Submit form
  form.addEventListener("submit", async function (e) {
    if (clickedButton === "skip") return; // let default skip happen

    e.preventDefault();

    const formData = new FormData();

    // Add selected profile pic file
    if (profileInput.files.length > 0) {
      formData.append("profile_pic", profileInput.files[0]);
    }

    // Add selected cover image file
    if (coverInput.files.length > 0) {
      formData.append("cover_image", coverInput.files[0]);
    }

    formData.append("bio", document.getElementById("bio").value);
    formData.append("location", document.getElementById("location").value);

    try {
      const response = await fetch("/complete-profile", {
        method: "POST",
        body: formData,
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else {
        const msg = await response.text();
        alert("Failed to save profile: " + msg);
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading profile. Try again.");
    }
  });
});
