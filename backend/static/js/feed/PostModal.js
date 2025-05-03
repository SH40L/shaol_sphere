export class PostModal {
    constructor() {
      this.postModal = document.getElementById("postModal");
      this.openPostInput = document.getElementById("openPostModal");
      this.closeModal = document.getElementById("closeModal");
      this.captionInput = document.getElementById("modalCaption");
      this.mediaInput = document.getElementById("mediaInput");
      this.postButton = document.getElementById("submitPost");
      this.imgPreview = document.getElementById("mediaPreview");
      this.videoPreview = document.getElementById("videoPreview");
      
      this.initializeEventListeners();
    }
  
    initializeEventListeners() {
      this.openPostInput.addEventListener("click", () => this.showModal());
      this.closeModal.addEventListener("click", () => this.resetModal());
      this.mediaInput.addEventListener("change", () => this.handleMediaPreview());
      this.captionInput.addEventListener("input", () => this.updatePostButtonState());
    }
  
    showModal() {
      this.postModal.style.display = "flex";
    }
  
    resetModal() {
      this.postModal.style.display = "none";
      this.captionInput.value = "";
      this.mediaInput.value = "";
      this.imgPreview.style.display = "none";
      this.videoPreview.style.display = "none";
      this.postButton.disabled = true;
      this.postButton.classList.add("disabled-post-btn");
      this.postButton.innerText = "Post";
    }
  
    handleMediaPreview() {
      const file = this.mediaInput.files[0];
      if (!file) return;
  
      const url = URL.createObjectURL(file);
      if (file.type.startsWith("image/")) {
        this.imgPreview.src = url;
        this.imgPreview.style.display = "block";
        this.videoPreview.style.display = "none";
      } else if (file.type.startsWith("video/")) {
        this.videoPreview.src = url;
        this.videoPreview.style.display = "block";
        this.imgPreview.style.display = "none";
      }
      this.updatePostButtonState();
    }
  
    updatePostButtonState() {
      const hasCaption = this.captionInput.value.trim().length > 0;
      const hasMedia = this.mediaInput.files.length > 0;
      this.postButton.disabled = !(hasCaption || hasMedia);
      this.postButton.classList.toggle("disabled-post-btn", this.postButton.disabled);
    }
  }