document.addEventListener("DOMContentLoaded", () => {
  let loading = false;
  let page = 1;
  const postsSection = document.getElementById("posts-section");
  const spinner = document.getElementById("load-more-spinner");

  // ✅ Confirm and delete post
  window.showDeleteMenu = function (postId) {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePost(postId);
    }
  };

  function deletePost(postId) {
    fetch(`/delete-post/${postId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const postEl = document.querySelector(`[data-post-id="${postId}"]`);
          if (postEl) postEl.remove();
        } else {
          alert("Failed to delete post.");
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Something went wrong.");
      });
  }

  // ✅ Infinite scroll
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

    fetch(`${window.location.pathname}?page=${page}`)
      .then((res) => res.text())
      .then((html) => {
        const temp = document.createElement("div");
        temp.innerHTML = html;

        const newPosts = temp.querySelectorAll("#posts-section .post");
        if (newPosts.length > 0) {
          newPosts.forEach((post) => postsSection.appendChild(post));
          loading = false;
          spinner.style.display = "none";
        } else {
          spinner.textContent = "No more posts.";
        }
      })
      .catch((err) => {
        console.error(err);
        spinner.style.display = "none";
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

          // 🟢 Update follower count in real-time
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
});
