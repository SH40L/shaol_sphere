// CommentManager.js
export class CommentManager {
  constructor() {
    // ✅ Detect if we're on post details page (by layout width)
    this.isPostDetails = document.querySelector('.post[style*="max-width: 800px"]') !== null;
    this.init();
  }

  init() {
    document.addEventListener('keydown', async (e) => {
      if (e.target.matches('.comment-input input') && e.key === 'Enter') {
        e.preventDefault();
        await this.submitComment(e.target);
      }
    });
  }

  async submitComment(inputElem) {
    const postId = inputElem.dataset.postId;
    const content = inputElem.value.trim();
    if (!content) return;

    try {
      const res = await fetch("/comment-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, content })
      });

      const data = await res.json();
      if (data.success && data.your_comment) {
        const postElem = inputElem.closest('.post');
        const commentInput = postElem.querySelector('.comment-input');

        // ✅ Conditionally add time for post details page
        const timeHTML = this.isPostDetails
          ? `<span class="comment-date">${data.your_comment.created_at}</span>`
          : "";

        const commentHTML = `
          <div class="comment">
            <a href="/${data.your_comment.username}">
              <img src="${data.your_comment.user_pic || '/static/uploads/default.jpg'}"
                   onerror="this.onerror=null;this.src='/static/uploads/default.jpg';">
            </a>
            <div class="comment-body">
              <p class="comment-meta">
                <strong><a href="/${data.your_comment.username}">${data.your_comment.user_name}</a></strong>
                ${timeHTML}
              </p>
              <p class="comment-content">${data.your_comment.content}</p>
            </div>
          </div>
        `;

        commentInput.insertAdjacentHTML('afterend', commentHTML);
        inputElem.value = "";

        // ✅ Update comment count (same as old working version)
        const commentBtn = postElem.querySelector(".comment-btn span");
        if (commentBtn) commentBtn.textContent = data.comment_count;
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
    }
  }
}
