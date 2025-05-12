document.addEventListener("DOMContentLoaded", () => {
  const burger = document.querySelector(".burger-menu");
  const dropdown = document.getElementById("burger-dropdown");
  const searchBox = document.getElementById("search-posts");
  const badge = document.getElementById("notif-badge");

  // ✅ Toggle dropdown menu
  burger.addEventListener("click", () => {
    dropdown.classList.toggle("show");
  });

  // ✅ Hide dropdown if clicked outside
  window.addEventListener("click", (e) => {
    if (!burger.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });

  // ✅ Post search on Enter
  searchBox.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      const query = searchBox.value.trim();
      if (query) {
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
      }
    }
  });

  // ✅ Always show red dot if unread exists, hide only when all are read
  function checkUnreadNotifications() {
    fetch("/notifications/unread-count")
      .then(res => res.json())
      .then(data => {
        if (badge) {
          badge.style.display = data.count > 0 ? "inline-block" : "none";
        }
      });
  }

  setInterval(checkUnreadNotifications, 15000);
  checkUnreadNotifications();
});
