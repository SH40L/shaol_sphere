// ✅ Toast message utility
export function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ✅ Inject new post card to feed or profile
export function injectNewPost(post, feedContainer, insertAtTop = false) {
  const div = document.createElement("div");
  div.className = "post";
  div.setAttribute("data-post-id", post.id);

  const generateMediaHTML = (mediaUrl) => {
    if (!mediaUrl) return "";
    const isVideo = mediaUrl.endsWith(".mp4");
    return `
      <div class="post-media">
        ${isVideo ? `<video controls src="${mediaUrl}"></video>` : `<img src="${mediaUrl}">`}
      </div>`;
  };

  let sharedHTML = "";
  if (post.shared_from && post.original_post) {
    sharedHTML = `
      <div class="shared-post">
        <div class="shared-post-header">
          <a href="/${post.original_post.username}">
            <img src="${post.original_post.user_pic || '/static/uploads/default.jpg'}"
              onerror="this.onerror=null;this.src='/static/uploads/default.jpg';">
          </a>
          <div>
            <p><a href="/${post.original_post.username}">${post.original_post.user_name}</a></p>
            <p class="post-date">${post.original_post.created_at}</p>
          </div>
        </div>
        <p class="shared-post-caption">${post.original_post.content}</p>
        ${generateMediaHTML(post.original_post.media_url)}
      </div>`;
  }

  let recentCommentHTML = "";
  if (post.recent_comment) {
    recentCommentHTML = `
      <div class="comment">
        <a href="/${post.recent_comment.username}">
          <img src="${post.recent_comment.user_pic || '/static/uploads/default.jpg'}"
            onerror="this.onerror=null;this.src='/static/uploads/default.jpg';">
        </a>
        <div class="comment-body">
          <p class="comment-meta">
            <strong><a href="/${post.recent_comment.username}">${post.recent_comment.user_name}</a></strong>
          </p>
          <p class="comment-content">${post.recent_comment.content}</p>
        </div>
      </div>`;
  }

  div.innerHTML = `
    <div class="post-header">
      <div class="post-header-left">
        <a href="/${post.username}">
          <img src="${post.user_pic || '/static/uploads/default.jpg'}"
            class="post-user-img"
            onerror="this.onerror=null;this.src='/static/uploads/default.jpg';">
        </a>
        <div>
          <p class="post-user-name">
            <a href="/${post.username}" class="poster-link">${post.user_name}</a>
          </p>
          <p class="post-date">${post.created_at}</p>
        </div>
      </div>
      <div class="post-options-wrapper">
        <button class="dots-btn">⋮</button>
        <div class="post-options-menu" style="display: none;">
          <a href="/post/${post.id}" class="view-full-post-option">View Full Post</a>
        </div>
      </div>
    </div>

    <p class="post-caption">${post.caption || ""}</p>
    ${sharedHTML || generateMediaHTML(post.media_url)}

    <div class="post-actions">
      <button class="like-btn"
        data-liked="${post.liked ? "true" : "false"}"
        onclick="toggleLike(this)"
        data-post-id="${post.id}">
        👍 <span>${post.like_count}</span> Likes
      </button>
      <button class="comment-btn">💬 <span>${post.comment_count}</span> Comments</button>
      <button class="share-btn" data-post-id="${post.id}">
        🔗 <span>${post.share_count ?? 0}</span> Shares
      </button>
    </div>

    <div class="comment-section">
      <div class="comment-input">
        <img src="${post.user_pic || '/static/uploads/default.jpg'}"
          onerror="this.onerror=null;this.src='/static/uploads/default.jpg';">
        <input type="text" placeholder="Comment your thought"
          onkeydown="submitComment(event, this)"
          data-post-id="${post.id}">
      </div>
      ${recentCommentHTML}
    </div>
  `;

  insertAtTop ? feedContainer.prepend(div) : feedContainer.appendChild(div);
}

// ✅ Add missing functions and export them

export function toggleLike(button) {
  const postId = button.getAttribute("data-post-id");

  fetch(`/like/${postId}`, { method: "POST" })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        button.setAttribute("data-liked", data.liked.toString());
        const span = button.querySelector("span");
        if (span) span.textContent = data.like_count;
      }
    });
}

export function submitComment(event, input) {
  if (event.key === "Enter") {
    const content = input.value.trim();
    const postId = input.getAttribute("data-post-id");
    if (!content) return;

    fetch(`/comment/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("Comment posted");
          input.value = "";
        }
      });
  }
}
