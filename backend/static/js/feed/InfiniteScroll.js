import { injectNewPost } from './utils.js';

export class InfiniteScroll {
  constructor(feedContainer) {
    this.feedContainer = feedContainer;
    this.offset = 3;
    this.isLoading = false;
    this.initializeScrollListener();
  }

  initializeScrollListener() {
    window.addEventListener("scroll", () => this.handleScroll());
  }

  handleScroll() {
    if (this.isLoading) return;

    const scrollY = window.innerHeight + window.scrollY;
    const bottom = document.body.offsetHeight - 300;

    if (scrollY >= bottom) {
      this.isLoading = true;
      this.loadMorePosts();
    }
  }

  loadMorePosts() {
    fetch(`/load-posts?offset=${this.offset}&limit=3`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.posts.length > 0) {
          data.posts.forEach(post => injectNewPost(post, this.feedContainer, false));
          this.offset += data.posts.length;
          this.isLoading = false;
        }
      })
      .catch(err => {
        console.error("Scroll load failed", err);
        this.isLoading = false;
      });
  }
}