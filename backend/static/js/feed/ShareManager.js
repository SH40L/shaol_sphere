// js/feed/ShareManager.js
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
    // Delegated event listener for share buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('share-btn')) {
        this.handleShareClick(e.target);
      }
    });

    this.closeShareModal.addEventListener('click', () => this.closeModal());
    this.submitShare.addEventListener('click', () => this.handleShareSubmit());
  }

  handleShareClick(shareButton) {
    const postElem = shareButton.closest('.post');
    this.currentPostId = postElem.dataset.postId;

    // Clone preview from post and insert into modal
    const cloned = postElem.cloneNode(true);
    cloned.querySelector('.post-actions').remove();
    cloned.querySelector('.comment-section').remove();
    this.sharePreview.innerHTML = '';
    this.sharePreview.appendChild(cloned);

    this.openModal();
  }

  openModal() {
    this.shareModal.style.display = "flex";
    this.shareMessage.value = "";
    this.submitShare.disabled = false;
    this.submitShare.classList.remove("disabled-post-btn");
  }

  closeModal() {
    this.shareModal.style.display = "none";
    this.sharePreview.innerHTML = "";
    this.currentPostId = null;
  }

  async handleShareSubmit() {
    const message = this.shareMessage.value.trim();
    if (!message || !this.currentPostId) return;

    this.submitShare.textContent = "Sharing...";
    this.submitShare.disabled = true;

    try {
      const response = await fetch("/share-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_post_id: this.currentPostId,
          message: message
        })
      });

      const data = await response.json();
      if (data.success) {
        injectNewPost(data.post, this.feedContainer, true);
        showToast("Post shared successfully!");
        this.closeModal();
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