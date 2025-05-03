import { showToast } from './utils.js';
import { injectNewPost } from './utils.js';

export class PostCreator {
  constructor(postModal) {
    this.postButton = document.getElementById("submitPost");
    this.feedContainer = document.getElementById("feed-posts");
    this.postModal = postModal;
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.postButton.addEventListener("click", () => this.handlePostCreation());
  }

  handlePostCreation() {
    const caption = document.getElementById("modalCaption").value.trim();
    const file = document.getElementById("mediaInput").files[0];
    const formData = new FormData();
    formData.append("caption", caption);
    if (file) formData.append("media", file);

    this.postButton.innerText = "Posting...";
    this.postButton.disabled = true;

    fetch("/post", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast("Post submitted!");
          injectNewPost(data.post, this.feedContainer, true);
          this.postModal.resetModal();
        } else {
          alert(data.message || "Post failed.");
          this.resetPostButton();
        }
      })
      .catch(() => {
        alert("Something went wrong!");
        this.resetPostButton();
      });
  }

  resetPostButton() {
    this.postButton.innerText = "Post";
    this.postButton.disabled = false;
  }
}