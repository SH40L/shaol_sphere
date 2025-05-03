document.addEventListener("DOMContentLoaded", () => {
  const openPostInput = document.getElementById("openPostModal");
  const postModal = document.getElementById("postModal");
  const closeModal = document.getElementById("closeModal");
  const captionInput = document.getElementById("modalCaption");
  const mediaInput = document.getElementById("mediaInput");
  const postButton = document.getElementById("submitPost");
  const toast = document.getElementById("toast");
  const feedContainer = document.getElementById("feed-posts");

  const imgPreview = document.getElementById("mediaPreview");
  const videoPreview = document.getElementById("videoPreview");

  // 🔄 Load Initial Posts
  fetch("/load-posts?offset=0&limit=3")
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        data.posts.forEach(post => injectNewPost(post, false));
      }
    });

  openPostInput.addEventListener("click", () => postModal.style.display = "flex");
  closeModal.addEventListener("click", () => resetModal());

  function resetModal() {
    postModal.style.display = "none";
    captionInput.value = "";
    mediaInput.value = "";
    imgPreview.style.display = "none";
    videoPreview.style.display = "none";
    postButton.disabled = true;
    postButton.classList.add("disabled-post-btn");
    postButton.innerText = "Post";
  }

  mediaInput.addEventListener("change", () => {
    const file = mediaInput.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (file.type.startsWith("image/")) {
      imgPreview.src = url;
      imgPreview.style.display = "block";
      videoPreview.style.display = "none";
    } else if (file.type.startsWith("video/")) {
      videoPreview.src = url;
      videoPreview.style.display = "block";
      imgPreview.style.display = "none";
    }
    updatePostButtonState();
  });

  captionInput.addEventListener("input", updatePostButtonState);

  function updatePostButtonState() {
    const hasCaption = captionInput.value.trim().length > 0;
    const hasMedia = mediaInput.files.length > 0;
    postButton.disabled = !(hasCaption || hasMedia);
    postButton.classList.toggle("disabled-post-btn", postButton.disabled);
  }

  // 🚀 Submit Post
  postButton.addEventListener("click", () => {
    const caption = captionInput.value.trim();
    const file = mediaInput.files[0];
    const formData = new FormData();
    formData.append("caption", caption);
    if (file) formData.append("media", file);

    postButton.innerText = "Posting...";
    postButton.disabled = true;

    fetch("/post", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast("Post submitted!");
          injectNewPost(data.post, true);
          resetModal();
        } else {
          alert(data.message || "Post failed.");
          postButton.innerText = "Post";
          postButton.disabled = false;
        }
      })
      .catch(() => {
        alert("Something went wrong!");
        postButton.innerText = "Post";
        postButton.disabled = false;
      });
  });

  function showToast(msg) {
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // ✅ LIKE Toggle
  window.toggleLike = (btn) => {
    const postId = btn.getAttribute("data-post-id");

    fetch("/like-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          btn.querySelector("span").textContent = data.like_count;
        }
      });
  };

  // ✅ COMMENT Submit
  window.submitComment = (e, input) => {
    if (e.key !== "Enter") return;
    const content = input.value.trim();
    if (!content) return;

    const postId = input.getAttribute("data-post-id");

    fetch("/comment-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, content })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const postElem = input.closest(".post");
          const section = postElem.querySelector(".comment-section");

          let html = "";

          if (data.your_comment) {
            html += `
              <div class="comment">
                <a href="/${data.your_comment.username}">
                  <img src="${data.your_comment.user_pic || '/static/uploads/default.jpg'}"
                       onerror="this.onerror=null;this.src='/static/uploads/default.jpg';">
                </a>
                <p><strong><a href="/${data.your_comment.username}">${data.your_comment.user_name}</a></strong> ${data.your_comment.content}</p>
              </div>`;
          }

          if (data.recent_comment && data.recent_comment.username !== data.your_comment.username) {
            html += `
              <div class="comment">
                <a href="/${data.recent_comment.username}">
                  <img src="${data.recent_comment.user_pic || '/static/uploads/default.jpg'}"
                       onerror="this.onerror=null;this.src='/static/uploads/default.jpg';">
                </a>
                <p><strong><a href="/${data.recent_comment.username}">${data.recent_comment.user_name}</a></strong> ${data.recent_comment.content}</p>
              </div>`;
          }

          // Insert new comment AFTER the input but BEFORE old comments
          const commentInput = postElem.querySelector(".comment-input");
          commentInput.insertAdjacentHTML("afterend", html);

          // Update comment count
          const commentBtn = postElem.querySelector(".comment-btn span");
          if (commentBtn) commentBtn.textContent = data.comment_count;

          input.value = "";
        }
      });
  };

  // 🧩 Inject post
  function injectNewPost(post, insertAtTop = false) {
    const div = document.createElement("div");
    div.className = "post";
    div.setAttribute("data-post-id", post.id);

    let mediaHTML = "";
    if (post.media_url) {
      mediaHTML = post.media_url.endsWith(".mp4")
        ? `<video controls src="${post.media_url}"></video>`
        : `<img src="${post.media_url}">`;
    }

    let recentCommentHTML = "";
    if (post.recent_comment) {
      recentCommentHTML = `
        <div class="comment">
          <a href="/${post.recent_comment.username}">
            <img src="${post.recent_comment.user_pic || '/static/uploads/default.jpg'}"
                 onerror="this.onerror=null;this.src='/static/uploads/default.jpg';">
          </a>
          <p><strong><a href="/${post.recent_comment.username}">${post.recent_comment.user_name}</a></strong> ${post.recent_comment.content}</p>
        </div>`;
    }

    div.innerHTML = `
      <div class="post-header">
        <img src="${post.user_pic || '/static/uploads/default.jpg'}" class="post-user-img"
             onerror="this.onerror=null;this.src='/static/uploads/default.jpg';">
        <div>
          <p class="post-user-name">
            <a href="/${post.username}" class="poster-link">${post.user_name}</a>
          </p>
          <p class="post-date">${post.created_at}</p>
        </div>
      </div>
      <p class="post-caption">${post.caption}</p>
      <div class="post-media">${mediaHTML}</div>
      <div class="post-actions">
        <button class="like-btn" data-liked="${post.liked}" onclick="toggleLike(this)" data-post-id="${post.id}">
          👍 <span>${post.like_count}</span> Likes
        </button>
        <button class="comment-btn">💬 <span>${post.comment_count}</span> Comments</button>
        <button class="share-btn">🔗 Share</button>
      </div>
      <div class="comment-section">
        <div class="comment-input">
          <img src="${post.user_pic || '/static/uploads/default.jpg'}"
               onerror="this.onerror=null;this.src='/static/uploads/default.jpg';">
          <input type="text" placeholder="Comment your thought"
                 onkeydown="submitComment(event, this)" data-post-id="${post.id}">
        </div>
        ${recentCommentHTML}
      </div>`;

    if (insertAtTop) {
      feedContainer.prepend(div);
    } else {
      feedContainer.appendChild(div);
    }
  }

  // 🔄 Infinite Scroll
  let offset = 3;
  let isLoading = false;

  window.addEventListener("scroll", () => {
    if (isLoading) return;

    const scrollY = window.innerHeight + window.scrollY;
    const bottom = document.body.offsetHeight - 300;

    if (scrollY >= bottom) {
      isLoading = true;
      fetch(`/load-posts?offset=${offset}&limit=3`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.posts.length > 0) {
            data.posts.forEach(post => injectNewPost(post, false));
            offset += data.posts.length;
            isLoading = false;
          } else {
            console.log("✅ All posts loaded");
          }
        })
        .catch(err => {
          console.error("Scroll load failed", err);
        });
    }
  });
});
