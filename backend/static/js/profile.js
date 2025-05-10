import { LikeManager } from './feed/LikeManager.js';
import { CommentManager } from './feed/CommentManager.js';
import { ShareManager } from './feed/ShareManager.js';
import { injectNewPost, showToast } from './feed/utils.js';

document.addEventListener("DOMContentLoaded", () => {
  const username = window.location.pathname.split("/")[1];
  const postsSection = document.getElementById("posts-section");
  const spinner = document.getElementById("load-more-spinner");
  const likeCountElem = document.querySelector(".profile-stats div:last-child strong");

  // ✅ Post Menu Logic
  class PostOptionsManager {
    constructor({ deleteCallback = () => {} } = {}) {
      this.deleteCallback = deleteCallback;
      this.init();
      this.bindExistingPosts();
    }

    init() {
      // 🔁 Global close for menus
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".post-options-wrapper")) {
          document.querySelectorAll(".post-options-menu").forEach(menu => {
            menu.style.display = "none";
          });
        }

        // ✅ Handle Delete Option click
        if (e.target.closest(".delete-post-option")) {
          const btn = e.target.closest(".delete-post-option");
          const postId = btn.dataset.postId;
          this.confirmDelete(postId);
        }
      });
    }

    bindExistingPosts() {
      document.querySelectorAll(".post-options-wrapper").forEach(wrapper => {
        if (wrapper.dataset.initialized === "true") return;

        const btn = wrapper.querySelector(".dots-btn");
        const menu = wrapper.querySelector(".post-options-menu");

        btn.addEventListener("click", (e) => {
          e.stopPropagation();

          // Close all others
          document.querySelectorAll(".post-options-menu").forEach(m => {
            if (m !== menu) m.style.display = "none";
          });

          // Toggle this one
          menu.style.display = (menu.style.display === "block") ? "none" : "block";
        });

        wrapper.dataset.initialized = "true";
      });
    }

    confirmDelete(postId) {
      const modal = document.getElementById("delete-modal");
      const confirmBtn = document.getElementById("confirm-delete");
      modal.style.display = "flex";
      confirmBtn.dataset.postId = postId;
      confirmBtn.onclick = () => this.deletePost(postId);
    }

    deletePost(postId) {
      fetch(`/delete-post/${postId}`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const postElem = document.querySelector(`.post[data-post-id="${postId}"]`);
            if (postElem) postElem.remove();
            this.deleteCallback();
            showToast("Post deleted successfully");
          } else {
            showToast("Failed to delete post.");
          }
        })
        .finally(() => {
          document.getElementById("delete-modal").style.display = "none";
        });
    }
  }

  // ✅ Initialize Managers
  const likeManager = new LikeManager(updateLikeStats);
  const commentManager = new CommentManager();
  const shareManager = new ShareManager();
  const postOptionsManager = new PostOptionsManager({
    deleteCallback: () => {
      updateLikeStats();
      const postCountElem = document.querySelector('.profile-stats div:first-child strong');
      postCountElem.textContent = parseInt(postCountElem.textContent) - 1;
    }
  });

  // ✅ Infinite Scroll
  let offset = document.querySelectorAll(".post").length;
  const limit = 10;
  let loading = false;
  let hasMore = true;

  async function loadMorePosts() {
    if (loading || !hasMore) return;
    loading = true;
    spinner.style.display = "block";

    try {
      const res = await fetch(`/${username}/posts?offset=${offset}&limit=${limit}`);
      const data = await res.json();

      if (data.posts_html && data.posts_html.trim() !== '') {
        const temp = document.createElement("div");
        temp.innerHTML = data.posts_html;
        const newPosts = temp.querySelectorAll(".post");

        if (newPosts.length > 0) {
          newPosts.forEach(post => postsSection.appendChild(post));
          offset += newPosts.length;
          hasMore = data.has_more;

          postOptionsManager.bindExistingPosts();
          likeManager.initializeGlobalFunctions();
          commentManager.initialize();
          shareManager.initializeEventListeners();
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      loading = false;
      spinner.style.display = "none";
    }
  }

  function throttle(callback, limit) {
    let wait = false;
    return function () {
      if (!wait) {
        callback.call();
        wait = true;
        setTimeout(() => {
          wait = false;
        }, limit);
      }
    };
  }

  window.addEventListener("scroll", throttle(() => {
    const threshold = 300;
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - threshold &&
      !loading && hasMore
    ) {
      loadMorePosts();
    }
  }, 100));

  // ✅ Follow Button
  document.getElementById("follow-btn")?.addEventListener("click", async () => {
    try {
      const res = await fetch(`/follow/${username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      if (data.success) {
        const followBtn = document.getElementById("follow-btn");
        const followerCountElem = document.querySelector(".profile-stats div:nth-child(2) strong");

        followBtn.textContent = data.following ? "Unfollow" : "Follow";
        followerCountElem.textContent = data.follower_count;
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  });

  // ✅ Like Stats
  function updateLikeStats() {
    fetch(`/profile/${username}/like-count`)
      .then((res) => res.json())
      .then((data) => {
        if (data.total_likes !== undefined) {
          likeCountElem.textContent = data.total_likes;
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch updated like count", err);
      });
  }

  // ✅ Global close for delete modal
  window.closeDeleteModal = function () {
    document.getElementById("delete-modal").style.display = "none";
  };
});
