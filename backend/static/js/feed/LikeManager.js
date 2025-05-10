export class LikeManager {
  constructor(updateCallback) {  // Add callback parameter
    this.updateCallback = updateCallback;
    this.initializeGlobalFunctions();
  }

  initializeGlobalFunctions() {
    window.toggleLike = (btn) => {
      const postId = btn.getAttribute("data-post-id");
      this.handleLikeToggle(btn, postId);
    };
  }

  handleLikeToggle(btn, postId) {
    fetch("/like-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          btn.querySelector("span").textContent = data.like_count;
          if (this.updateCallback) this.updateCallback();  // Add this line
        }
      });
  }
}