// mydex-modal.js
import { loadMyDex, removeFromMyDex } from "./mydex.js";

export function renderMyDexModal() {
  const modal = document.getElementById("modal-mydex");
  const container = modal.querySelector(".mydex-content");
  container.innerHTML = "";

  const dex = loadMyDex();
  if (dex.length === 0) {
    container.innerHTML =
      '<p class="not-saved">아직 저장된 포켓몬이 없어요!</p>';
    return;
  }

  dex.forEach((pokemon) => {
    const card = document.createElement("div");
    card.className = "dex-card";
    card.innerHTML = `
      <img src="${pokemon.image}" alt="${pokemon.name}">
      <p>${pokemon.name}</p>
      <button class="remove" data-id="${pokemon.id}">❌</button>
    `;
    container.appendChild(card);
  });

  // 삭제 이벤트
  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove")) {
      const id = e.target.dataset.id;
      removeFromMyDex(id);
      renderMyDexModal(); // 다시 그리기
    }
  });
}
