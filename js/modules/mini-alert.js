export default class MiniAlert {
  constructor({ title, message, closeBackdrop = true, onClose }) {
    this.closeBackdrop = closeBackdrop;
    this.onClose = onClose;

    // 백드롭 생성
    this.backdrop = document.createElement("div");
    this.backdrop.classList.add("mini-alert-backdrop");

    // 모달 생성
    this.modal = document.createElement("div");
    this.modal.classList.add("mini-alert"); // CSS에서 스타일 적용

    this.modal.innerHTML = `
      <h2 class="mini-alert-title" style="display:${
        title ? "block" : "none"
      };">${title || ""}</h2>
      <p class="mini-alert-message">${message}</p>
      <button class="mini-alert-close-btn">확인</button>
    `;

    this.backdrop.append(this.modal);
    document.body.appendChild(this.backdrop);

    // 이벤트
    this.modal
      .querySelector(".mini-alert-close-btn")
      .addEventListener("click", () => this.close());

    this.backdrop.addEventListener("click", () => {
      if (this.closeBackdrop) this.close();
    });

    this.modal.addEventListener("click", (e) => e.stopPropagation());
  }

  close() {
    this.backdrop.remove();
    if (typeof this.onClose === "function") this.onClose();
  }

  static fire(options) {
    return new MiniAlert(options);
  }
}
