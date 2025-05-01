document.addEventListener("DOMContentLoaded", () => {
  const burger = document.querySelector(".burger-menu");
  const dropdown = document.getElementById("burger-dropdown");
  const searchBox = document.getElementById("search-posts");

  // ✅ Toggle dropdown menu
  burger.addEventListener("click", () => {
    dropdown.classList.toggle("show");
  });

  // ✅ Hide menu when clicking outside
  window.addEventListener("click", (e) => {
    if (!burger.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });

  // ✅ Search trigger
  searchBox.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      const query = searchBox.value.trim();
      if (query) {
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
      }
    }
  });
});
