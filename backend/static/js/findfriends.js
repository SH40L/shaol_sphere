document.addEventListener("DOMContentLoaded", () => {
  const friendList = document.getElementById("friend-list");
  const searchInput = document.getElementById("friend-search");

  let offset = 0;
  let searchQuery = "";
  let loading = false;
  let noMoreUsers = false;

  // 🔍 Search on Enter key press
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query.length > 0) {
        searchQuery = query;
        offset = 0;
        noMoreUsers = false;
        friendList.innerHTML = "";
        loadUsers();
      }
    }
  });

  // 🧠 Load users from API
  async function loadUsers() {
    if (loading || noMoreUsers) return;
    loading = true;

    try {
      const res = await fetch(`/api/findfriends?offset=${offset}&search=${encodeURIComponent(searchQuery)}`);
      const users = await res.json();

      if (users.length === 0) {
        noMoreUsers = true;
        if (offset === 0) {
          friendList.innerHTML = `<div class="no-users-message">No users found.</div>`;
        }
        return;
      }

      users.forEach((user) => {
        const card = document.createElement("div");
        card.className = "friend-card";
        card.setAttribute("data-user-id", user.id);
        card.innerHTML = `
          <div class="friend-info">
            <img src="${user.profile_pic}" class="friend-avatar" data-default-src="/static/uploads/default.jpg" />
            <div class="friend-details">
              <a class="friend-name" href="/${user.username}" target="_blank">${user.full_name}</a>
              <div class="friend-bio">${user.bio}</div>
            </div>
          </div>
          <button class="follow-btn ${user.is_following ? 'following' : ''}" data-user-id="${user.id}">
            ${user.is_following ? 'Following' : 'Follow'}
          </button>
        `;
        friendList.appendChild(card);
      });

      offset += users.length;

      // ✅ Fallback profile images
      document.querySelectorAll(".friend-avatar").forEach((img) => {
        img.addEventListener("error", () => {
          const fallback = img.dataset.defaultSrc;
          if (img.src !== fallback) {
            img.src = fallback;
          }
        });
      });
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      loading = false;
    }
  }

  // 🌀 Infinite Scroll
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
      loadUsers();
    }
  });

  // 🔁 Follow/Unfollow button logic
  friendList.addEventListener("click", (e) => {
    if (e.target.classList.contains("follow-btn")) {
      const button = e.target;
      const userId = button.dataset.userId;
      const isFollowing = button.classList.contains("following");
      const action = isFollowing ? "unfollow" : "follow";

      fetch(`/${action}/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            button.classList.toggle("following");
            button.textContent = isFollowing ? "Follow" : "Following";
          } else {
            alert(result.error || "Something went wrong.");
          }
        })
        .catch(err => {
          console.error(err);
          alert("Network error occurred.");
        });
    }
  });

  // 🔃 Load initial 12 random users
  loadUsers();
});
