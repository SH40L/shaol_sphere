document.addEventListener("DOMContentLoaded", () => {
  const markAllBtn = document.getElementById("mark-all-read");
  const badge = document.getElementById("notif-badge");
  let lastUnreadCount = 0;

  // 🔸 Track initial IDs on page load (to prevent animating old ones)
  const initialNotificationIDs = new Set(
    Array.from(document.querySelectorAll(".notification-item")).map(el =>
      el.getAttribute("href")
    )
  );

  // 🔸 Track already animated notification IDs
  const animatedIDs = new Set(initialNotificationIDs);

  // ✅ If page loads with no unread, dim the button
  if (!document.querySelector(".notification-item.unread")) {
    markAllBtn.classList.add("read-all");
    if (badge) badge.style.display = "none";
  }

  // ✅ Mark All as Read
  if (markAllBtn) {
    markAllBtn.addEventListener("click", () => {
      fetch("/notifications/mark-all-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            document.querySelectorAll(".notification-item").forEach(el => {
              el.classList.remove("unread", "new");
              el.classList.add("read");
            });
            markAllBtn.classList.add("read-all");
            if (badge) badge.style.display = "none";
          }
        });
    });
  }

  // ✅ Poll for new notifications and reload list if needed
  function checkUnreadNotifications() {
    fetch("/notifications/unread-count")
      .then(res => res.json())
      .then(data => {
        if (badge) {
          badge.style.display = data.count > 0 ? "inline-block" : "none";
        }

        if (markAllBtn) {
          markAllBtn.classList.toggle("read-all", data.count === 0);
        }

        if (data.count > lastUnreadCount) {
          reloadNotificationList();
        }

        lastUnreadCount = data.count;
      });
  }

  // ✅ Reload and animate only the newest notification
  function reloadNotificationList() {
    fetch("/notifications")
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newList = doc.querySelector("#notification-list");
        const currentList = document.querySelector("#notification-list");

        if (newList && currentList) {
          const newItems = newList.querySelectorAll(".notification-item");
          currentList.innerHTML = "";

          newItems.forEach(el => {
            const id = el.getAttribute("href");

            // ✅ Only animate if not already seen/animated
            if (!animatedIDs.has(id)) {
              el.classList.add("new");
              animatedIDs.add(id); // ✅ Mark as animated so it won't animate again
            }

            currentList.appendChild(el);
          });
        }
      });
  }

  // 🔁 Start polling
  setInterval(checkUnreadNotifications, 1000);
  checkUnreadNotifications();
});