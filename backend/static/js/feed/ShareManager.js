import { showToast, injectNewPost } from './utils.js';

export class ShareManager {
  constructor() {
    this.shareModal = document.getElementById("shareModal");
    this.closeShareModal = document.getElementById("closeShareModal");
    this.shareMessage = document.getElementById("shareMessage");
    this.sharePreview = document.getElementById("sharePreview");
    this.submitShare = document.getElementById("submitShare");
    this.feedContainer = document.getElementById("feed-posts");

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document.addEventListener('click', (e) => {
      const shareButton = e.target.closest('.share-btn');
      if (shareButton) {
        this.handleShareClick(shareButton);
      }
    });

    this.submitShare.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleShareSubmit();
    });

    this.closeShareModal.addEventListener('click', () => this.closeModal());

    this.shareMessage.addEventListener('input', () => {
      const hasText = this.shareMessage.value.trim().length > 0;
      this.submitShare.disabled = !hasText;
      this.submitShare.classList.toggle("disabled-post-btn", !hasText);
    });
  }

  handleShareClick(shareButton) {
    let postId = shareButton.dataset.postId;
    const postElem = shareButton.closest('.post');

    if (!postId && postElem) {
      postId = postElem.dataset.postId;
    }

    if (!postId || postId === "undefined") {
      console.error("❌ Invalid or missing post ID");
      showToast("Something went wrong. Try refreshing.");
      return;
    }

    this.shareModal.dataset.postId = postId;

    const cloned = postElem.cloneNode(true);
    cloned.querySelector('.post-actions')?.remove();
    cloned.querySelector('.comment-section')?.remove();
    cloned.querySelector('.dots-btn')?.remove();

    this.sharePreview.innerHTML = '';
    this.sharePreview.appendChild(cloned);
    this.openModal();
  }

  openModal() {
    this.shareModal.style.display = "flex";
    this.shareMessage.value = "";
    this.submitShare.disabled = true;
    this.submitShare.classList.add("disabled-post-btn");
  }

  closeModal() {
    this.shareModal.style.display = "none";
    this.shareMessage.value = "";
    this.sharePreview.innerHTML = "";
    this.submitShare.textContent = "Share";
    delete this.shareModal.dataset.postId;
  }

  async handleShareSubmit() {
    const postId = this.shareModal.dataset.postId;
    const message = this.shareMessage.value.trim();

    if (!postId || postId === "undefined" || !message) {
      showToast("Invalid post. Cannot share.");
      return;
    }

    this.submitShare.textContent = "Sharing...";
    this.submitShare.disabled = true;

    try {
      const response = await fetch("/share-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_post_id: postId,
          message: message
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast("Post shared successfully!");
        this.closeModal();

        // ✅ Increment share count on the original post (A)
        const originalPost = document.querySelector(`.post[data-post-id="${postId}"]`);
        if (originalPost) {
          const shareCountSpan = originalPost.querySelector(".share-btn span");
          if (shareCountSpan) {
            const currentCount = parseInt(shareCountSpan.textContent) || 0;
            shareCountSpan.textContent = currentCount + 1;
          }
        }

        // ✅ Inject new shared post (B)
        if (this.feedContainer && data.post) {
          injectNewPost(data.post, this.feedContainer, true);
        } else {
          window.location.reload();
        }
      } else {
        showToast(data.message || "Failed to share post");
      }
    } catch (error) {
      console.error("Sharing error:", error);
      showToast("Error sharing post");
    } finally {
      this.submitShare.textContent = "Share";
      this.submitShare.disabled = false;
    }
  }
}
