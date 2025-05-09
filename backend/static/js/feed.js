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
  new ShareManager();

  // Initialize Post Options Manager FIRST
  class PostOptionsManager {
    constructor() {
      // Use event delegation for dynamically added elements
      document.addEventListener('click', (e) => {
        // Handle dots button click
        if (e.target.classList.contains('dots-btn')) {
          this.toggleOptionsMenu(e.target);
        }
        // Close menus when clicking outside
        else if (!e.target.closest('.post-options-menu')) {
          this.closeAllMenus();
        }
      });
    }

    // Updated toggleOptionsMenu method
    toggleOptionsMenu(button) {
      const menu = button.nextElementSibling;
      const isMenuVisible = menu.style.display === 'block';

      this.closeAllMenus();

      if (!isMenuVisible) {
        menu.style.display = 'block';
        // Calculate position relative to parent
        const parentRect = button.closest('.post-options-wrapper').getBoundingClientRect();
        menu.style.top = `${parentRect.height}px`;
        menu.style.right = '0';
      }
    }

    closeAllMenus() {
      document.querySelectorAll('.post-options-menu').forEach(menu => {
        menu.style.display = 'none';
      });
    }
  }
  new PostOptionsManager();

  // Load initial posts
  fetch("/load-posts?offset=0&limit=3")
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        data.posts.forEach(post => injectNewPost(post, feedContainer, false));
      }
    })
    .catch(error => {
      console.error('Error loading posts:', error);
    });
});