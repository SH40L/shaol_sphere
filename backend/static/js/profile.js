document.addEventListener("DOMContentLoaded", () => {
  let loading = false;
  let page = 1;
  const postsSection = document.getElementById("posts-section");
  const spinner = document.getElementById("load-more-spinner");

  // ✅ Infinite scroll with pagination
  window.addEventListener("scroll", () => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
      !loading
    ) {
      loadMorePosts();
    }
  });

  function loadMorePosts() {
    loading = true;
    spinner.style.display = "block";
    page++;

    const username = window.location.pathname.split('/')[1];
    fetch(`/${username}/posts?page=${page}`)
      .then((res) => res.text())
      .then((html) => {
        const temp = document.createElement("div");
        temp.innerHTML = html;

        const newPosts = temp.querySelectorAll(".post");
        if (newPosts.length > 0) {
          newPosts.forEach((post) => postsSection.appendChild(post));
          loading = false;
          spinner.style.display = "none";
        } else {
          spinner.textContent = "No more posts.";
          loading = true; // Prevent further fetches
        }
      })
      .catch((err) => {
        console.error(err);
        spinner.style.display = "none";
        loading = false;
      });
  }

  // ✅ Follow / Unfollow
  window.toggleFollow = function (username) {
    const button = document.getElementById("follow-btn");

    fetch(`/follow/${username}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          button.textContent = data.following ? "Unfollow" : "Follow";

          // 🟢 Update follower count
          const statBlocks = document.querySelectorAll(".profile-stats div");
          if (statBlocks.length >= 2) {
            const followerBlock = statBlocks[1];
            const followerCount = followerBlock.querySelector("strong");
            if (followerCount) {
              followerCount.textContent = data.follower_count;
            }
          }
        } else {
          alert("Action failed.");
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Network error occurred.");
      });
  };

  // ✅ Toggle dropdown menu
  window.togglePostOptions = function (button) {
    const menu = button.nextElementSibling;
    document.querySelectorAll(".post-options-menu").forEach(m => {
      if (m !== menu) m.style.display = "none";
    });
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  };

  // ✅ Show modal from delete option
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("delete-post-option")) {
      const postId = e.target.getAttribute("data-post-id");
      document.getElementById("confirm-delete").setAttribute("data-post-id", postId);
      document.getElementById("delete-modal").style.display = "flex";
    }

    // Auto-close menus if clicked outside
    if (!e.target.closest(".post-options-wrapper")) {
      document.querySelectorAll(".post-options-menu").forEach(menu => {
        menu.style.display = "none";
      });
    }
  });

  // ✅ Close modal
  window.closeDeleteModal = function () {
    document.getElementById("delete-modal").style.display = "none";
  };

  // ✅ Confirm delete post
  const confirmBtn = document.getElementById("confirm-delete");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      const postId = confirmBtn.getAttribute("data-post-id");

      fetch(`/profile/delete-post/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const post = document.querySelector(`.post[data-post-id='${postId}']`);
            if (post) post.remove();
            closeDeleteModal();
          } else {
            alert("Failed to delete post.");
          }
        })
        .catch(error => {
          console.error("Error deleting post:", error);
          alert("Error deleting post.");
        });
    });
  }
});
