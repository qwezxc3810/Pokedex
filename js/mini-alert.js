export default class MiniAlert {
  constructor({ title, message, closeBackdrop = true, onClose }) {
    this.closeBackdrop = closeBackdrop;
    this.onClose = onClose;

    this.backdrop = document.createElement("div");
    this.backdrop.classList.add("mini-alert-backdrop");
    Object.assign(this.backdrop.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 200000, // 모달보다 무조건 위
    });

    const modal = document.createElement("div");
    Object.assign(modal.style, {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "5rem",
      textAlign: "center",
      padding: "2rem",
      background: "red",
      borderRadius: "1.4rem",
      boxShadow: "0 0 15px rgba(0,0,0,0.3)",
      maxWidth: "50rem",
      width: "80%",
      maxHeight: "40rem",
      height: "80%",
      position: "relative",
      zIndex: 20000,
    });

    modal.innerHTML = `
      <h2 style="display:${title ? "block" : "none"};">${title}</h2>
      <p>${message}</p>
      <button class="mini-alert-close-btn">확인</button>
    `;

    this.backdrop.append(modal);
    document.body.appendChild(this.backdrop);

    modal
      .querySelector(".mini-alert-close-btn")
      .addEventListener("click", () => this.close());
    this.backdrop.addEventListener("click", () => {
      if (this.closeBackdrop) this.close();
    });
    modal.addEventListener("click", (e) => e.stopPropagation());
  }

  close() {
    this.backdrop.remove();
    if (typeof this.onClose === "function") this.onClose();
  }

  static fire(options) {
    return new MiniAlert(options);
  }
}
