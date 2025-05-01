document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("friend-search");

  // 🔍 Search on Enter key press
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query.length > 0) {
        window.location.href = `/findfriends?search=${encodeURIComponent(query)}`;
      }
    }
  });

  // 🔄 Handle Follow/Unfollow button click
  document.querySelectorAll(".follow-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = button.dataset.userId;
      const isFollowing = button.classList.contains("following");
      const action = isFollowing ? "unfollow" : "follow";

      try {
        const response = await fetch(`/${action}/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (result.success) {
          button.classList.toggle("following");
          button.textContent = isFollowing ? "Follow" : "Following";
        } else {
          alert(result.error || "Something went wrong.");
        }
      } catch (err) {
        console.error(err);
        alert("Network error occurred.");
      }
    });
  });

  // ✅ Fallback profile image if broken
  document.querySelectorAll(".friend-avatar").forEach((img) => {
    img.addEventListener("error", () => {
      const fallback = img.dataset.defaultSrc;
      if (img.src !== fallback) {
        img.src = fallback;
      }
    });
  });
});
