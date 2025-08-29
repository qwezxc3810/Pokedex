export default class MiniAlert {
  constructor({ title, message, closeBackdrop = true, onClose }) {
    this.closeBackdrop = closeBackdrop;
    this.onClose = onClose;

    this.backdrop = document.createElement("div");
    this.backdrop.classList.add("mini-alert-backdrop");

    const modal = document.createElement("div");
    modal.classList.add("mini-alert");

    modal.innerHTML = `
      <div class="mini-alert-content">
        <h2 class="mini-alert-title" style="display: ${
          title ? "block" : "none"
        };">${title}</h2>
        <p class="mini-alert-message">${message}</p>
        <button class="mini-alert-close-btn">확인</button>
      </div>
    `;

    this.backdrop.append(modal);
    document.body.append(this.backdrop);

    // 이벤트 리스너에서 this.close() 호출
    const closeBtn = modal.querySelector(".mini-alert-close-btn");
    closeBtn.addEventListener("click", () => {
      this.close();
    });

    this.backdrop.addEventListener("click", (e) => {
      if (this.closeBackdrop) {
        this.close();
      }
    });

    modal.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // close 메서드 수정
  close() {
    this.backdrop.remove();
    if (typeof this.onClose === "function") {
      this.onClose();
    }
  }

  static fire(options) {
    const existingAlert = document.querySelector(".mini-alert-backdrop");
    if (existingAlert) {
      existingAlert.remove();
    }
    return new MiniAlert(options);
  }
}
