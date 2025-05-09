import { showToast, injectNewPost } from './utils.js';

export class ShareManager {
  constructor() {
    this.shareModal = document.getElementById("shareModal");
    this.closeShareModal = document.getElementById("closeShareModal");
    this.shareMessage = document.getElementById("shareMessage");
    this.sharePreview = document.getElementById("sharePreview");
    this.submitShare = document.getElementById("submitShare");
    this.feedContainer = document.getElementById("feed-posts"); // Only available on feed page

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Handle share button clicks anywhere in the doc
    document.addEventListener('click', (e) => {
      const shareButton = e.target.closest('.share-btn');
      if (shareButton) {
        this.handleShareClick(shareButton);
      }
    });

    // Submit share
    this.submitShare.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleShareSubmit();
    });

    // Close modal
    this.closeShareModal.addEventListener('click', () => this.closeModal());

    // Enable/disable share button
    this.shareMessage.addEventListener('input', () => {
      const hasText = this.shareMessage.value.trim().length > 0;
      this.submitShare.disabled = !hasText;
      this.submitShare.classList.toggle("disabled-post-btn", !hasText);
    });
  }

  handleShareClick(shareButton) {
    // Try get post ID from the button or the closest post container
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

    // Clone and clean post preview
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
    this.sharePreview.innerHTML = "";
    delete this.shareModal.dataset.postId;
    this.submitShare.textContent = "Share";
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

        // ✅ Inject new post into feed if available
        if (this.feedContainer && data.post) {
          injectNewPost(data.post, this.feedContainer);
        } else {
          // Otherwise, reload if not on feed
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
