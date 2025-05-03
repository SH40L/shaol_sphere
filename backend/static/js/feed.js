// js/feed/feed.js
import { PostModal } from './feed/PostModal.js';
import { PostCreator } from './feed/PostCreator.js';
import { LikeManager } from './feed/LikeManager.js';
import { CommentManager } from './feed/CommentManager.js';
import { InfiniteScroll } from './feed/InfiniteScroll.js';
import { ShareManager } from './feed/ShareManager.js';
import { injectNewPost } from './feed/utils.js';

document.addEventListener("DOMContentLoaded", () => {
  const feedContainer = document.getElementById("feed-posts");
  
  // Initialize all modules
  const postModal = new PostModal();
  new PostCreator(postModal);
  new LikeManager();
  new CommentManager();
  new InfiniteScroll(feedContainer);
  new ShareManager(); // Add ShareManager

  // Load initial posts
  fetch("/load-posts?offset=0&limit=3")
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        data.posts.forEach(post => injectNewPost(post, feedContainer, false));
      }
    });
});