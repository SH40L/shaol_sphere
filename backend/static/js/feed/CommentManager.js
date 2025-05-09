export class CommentManager {
  constructor() {
    this.initializeGlobalFunctions();
  }

  initializeGlobalFunctions() {
    window.submitComment = (e, input) => {
      if (e.key !== "Enter") return;
      const content = input.value.trim();
      if (!content) return;
      this.handleCommentSubmit(input, content);
    };
  }

  handleCommentSubmit(input, content) {
    const postId = input.getAttribute("data-post-id");

    fetch("/comment-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, content })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.updateCommentUI(input, data);
        }
      });
  }

  updateCommentUI(input, data) {
    const postElem = input.closest(".post");
    const section = postElem.querySelector(".comment-section");
    let html = "";

    if (data.your_comment) {
      html += this.createCommentHTML(data.your_comment);
    }

    if (data.recent_comment && data.recent_comment.username !== data.your_comment?.username) {
      html += this.createCommentHTML(data.recent_comment);
    }

    const commentInput = postElem.querySelector(".comment-input");
    commentInput.insertAdjacentHTML("afterend", html);

    const commentBtn = postElem.querySelector(".comment-btn span");
    if (commentBtn) commentBtn.textContent = data.comment_count;
    input.value = "";
  }

  createCommentHTML(comment) {
    return `
      <div class="comment">
        <a href="/${comment.username}">
          <img src="${comment.user_pic || '/static/uploads/default.jpg'}"
               onerror="this.onerror=null;this.src='/static/uploads/default.jpg';">
        </a>
        <div class="comment-body">
          <p class="comment-meta">
            <strong><a href="/${comment.username}">${comment.user_name}</a></strong>
          </p>
          <p class="comment-content">${comment.content}</p>
        </div>
      </div>`;
  }
}
