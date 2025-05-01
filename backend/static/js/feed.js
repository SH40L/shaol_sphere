document.addEventListener("DOMContentLoaded", () => {
    const openBtn = document.getElementById("openPostModal");
    const closeBtn = document.getElementById("closeModal");
    const modal = document.getElementById("postModal");
    const mediaInput = document.getElementById("mediaInput");
    const imgPreview = document.getElementById("mediaPreview");
    const videoPreview = document.getElementById("videoPreview");
    const submitBtn = document.getElementById("submitPost");
  
    // 🔹 Open modal
    openBtn.addEventListener("click", () => {
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
    });
  
    // 🔹 Close modal
    closeBtn.addEventListener("click", () => {
      closeModal();
    });
  
    window.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  
    function closeModal() {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
      document.getElementById("modalCaption").value = "";
      mediaInput.value = "";
      imgPreview.style.display = "none";
      videoPreview.style.display = "none";
    }
  
    // 🔹 Preview selected media
    mediaInput.addEventListener("change", () => {
      const file = mediaInput.files[0];
      if (!file) return;
  
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video/");
  
      if (isVideo) {
        videoPreview.src = url;
        videoPreview.style.display = "block";
        imgPreview.style.display = "none";
      } else {
        imgPreview.src = url;
        imgPreview.style.display = "block";
        videoPreview.style.display = "none";
      }
    });
  
    // 🔹 Submit post
    submitBtn.addEventListener("click", async () => {
      const caption = document.getElementById("modalCaption").value.trim();
      const file = mediaInput.files[0];
  
      if (!caption && !file) {
        alert("Please write something or upload media.");
        return;
      }
  
      const formData = new FormData();
      formData.append("content", caption);
      if (file) formData.append("media", file);
  
      try {
        const res = await fetch("/create-post", {
          method: "POST",
          body: formData,
        });
  
        const result = await res.json();
  
        if (result.success) {
          alert("Post created!");
          window.location.reload();
        } else {
          alert("Post failed.");
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong.");
      }
    });
  
    // 🔹 Also allow clicking "Photo" or "Video" to open modal
    const photoBtn = document.getElementById("photoBtn");
    const videoBtn = document.getElementById("videoBtn");
    photoBtn.addEventListener("click", () => modal.style.display = "block");
    videoBtn.addEventListener("click", () => modal.style.display = "block");
  });
  