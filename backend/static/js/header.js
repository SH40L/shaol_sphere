document.addEventListener("DOMContentLoaded", () => {
  // ======== 🔷 BURGER MENU & SEARCH BAR ======== //
  const burger = document.querySelector(".burger-menu");
  const dropdown = document.getElementById("burger-dropdown");
  const searchBox = document.getElementById("search-posts");
  const badge = document.getElementById("notif-badge");

  burger.addEventListener("click", () => {
    dropdown.classList.toggle("show");
  });

  window.addEventListener("click", (e) => {
    if (!burger.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });

  searchBox.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      const query = searchBox.value.trim();
      if (query) {
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
      }
    }
  });

  function checkUnreadNotifications() {
    fetch("/notifications/unread-count")
      .then(res => res.json())
      .then(data => {
        if (badge) {
          badge.style.display = data.count > 0 ? "inline-block" : "none";
        }
      });
  }

  setInterval(checkUnreadNotifications, 15000);
  checkUnreadNotifications();

  // ======== 🔶 EMERGENCY ALERT MODAL LOGIC ======== //
  const openBtn = document.getElementById("openEmergencyModal");
  const modal = document.getElementById("emergencyModal");
  const closeBtn = document.getElementById("closeEmergencyModal");
  const submitBtn = document.getElementById("submitEmergencyAlert");
  const messageInput = document.getElementById("emergencyMessage");
  const locationStatus = document.getElementById("locationStatus");
  const toast = document.getElementById("emergencyToast");

  let userLocation = null;
  let alertLimitReached = false;

  // 🔹 Show modal
  openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    userLocation = null;
    alertLimitReached = false;
    submitBtn.textContent = "Send Alert";
    submitBtn.disabled = true;
    submitBtn.classList.add("disabled-post-btn");
    messageInput.value = "";
    locationStatus.textContent = "Fetching location...";
    getLocation();
  });

  // 🔹 Close modal
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    messageInput.value = "";
    locationStatus.textContent = "Fetching location...";
    userLocation = null;
    validateForm();
  });

  // 🔹 Get location
  function getLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        };
        locationStatus.textContent = "Location acquired.";
        validateForm();
      },
      (err) => {
        userLocation = null;
        locationStatus.textContent = "Location access denied.";
        validateForm();
      }
    );
  }

  // 🔹 Enable or disable send button
  function validateForm() {
    const message = messageInput.value.trim();
    if (message !== "" && userLocation && !alertLimitReached) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("disabled-post-btn");
    } else {
      submitBtn.disabled = true;
      submitBtn.classList.add("disabled-post-btn");
    }
  }

  // 🔹 Watch message input
  messageInput.addEventListener("input", validateForm);

  // 🔹 Submit Emergency Alert
  submitBtn.addEventListener("click", () => {
    const message = messageInput.value.trim();

    if (!message || !userLocation || alertLimitReached) return;

    fetch("/emergency-alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message,
        latitude: userLocation.lat,
        longitude: userLocation.lon
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showEmergencyToast("🚨 Emergency alert sent!");
          modal.style.display = "none";
          messageInput.value = "";
          userLocation = null;
          validateForm();
        } else {
          showEmergencyToast("⚠️ " + (data.message || "Failed to send alert."));

          if (data.message.includes("2 alerts")) {
            alertLimitReached = true;
            submitBtn.disabled = true;
            submitBtn.classList.add("disabled-post-btn");
            submitBtn.textContent = "2 alerts already sent";
          }
        }
      })
      .catch(() => {
        showEmergencyToast("⚠️ Failed to send alert.");
      });
  });

  // 🔹 Show toast message
  function showEmergencyToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  }
});
