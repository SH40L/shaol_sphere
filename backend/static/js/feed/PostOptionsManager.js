// js/feed/PostOptionsManager.js
export class PostOptionsManager {
    constructor() {
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('dots-btn')) {
          this.toggleOptionsMenu(e.target);
        } else if (!e.target.closest('.post-options-menu')) {
          this.closeAllMenus();
        }
      });
    }
  
    toggleOptionsMenu(button) {
      const menu = button.nextElementSibling;
      const isMenuVisible = menu.style.display === 'block';
      this.closeAllMenus();
      if (!isMenuVisible) {
        menu.style.display = 'block';
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
  