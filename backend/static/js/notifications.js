document.addEventListener("DOMContentLoaded", () => {
  const markAllBtn = document.getElementById("mark-all-read");
  let lastUnreadCount = 0;

  // ✅ If page loads with no unread, dim the button
  if (!document.querySelector(".notification-item.unread")) {
    markAllBtn.classList.add("read-all");
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
              el.classList.remove("unread");
              el.classList.add("read");
            });
            markAllBtn.classList.add("read-all");
          }
        });
    });
  }

  // ✅ Poll for new notifications and reload list if needed
  function checkUnreadNotifications() {
    fetch("/notifications/unread-count")
      .then(res => res.json())
      .then(data => {
        const markBtn = document.getElementById("mark-all-read");

        if (markBtn) {
          if (data.count === 0) {
            markBtn.classList.add("read-all");
          } else {
            markBtn.classList.remove("read-all");
          }
        }

        if (data.count > lastUnreadCount) {
          reloadNotificationList();
        }

        lastUnreadCount = data.count;
      });
  }

  function reloadNotificationList() {
    fetch("/notifications")
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newList = doc.querySelector("#notification-list");
        const currentList = document.querySelector("#notification-list");

        if (newList && currentList) {
          currentList.innerHTML = newList.innerHTML;
        }
      });
  }

  setInterval(checkUnreadNotifications, 15000);
  checkUnreadNotifications();
});
