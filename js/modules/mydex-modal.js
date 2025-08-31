// mydex-modal.js
// 마이덱스 모달 렌더링 및 삭제 기능
import { loadMyDex, removeFromMyDex } from "./mydex.js";

// ===== 모달 & 컨테이너 캐싱 =====
const modal = document.getElementById("modal-mydex");
const container = modal.querySelector(".mydex-content");

// ===== 삭제 버튼 이벤트 위임 =====
// container에 클릭 이벤트를 한 번만 등록하여
// 동적으로 생성되는 카드의 삭제 버튼도 처리 가능
container.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove")) {
    const id = e.target.dataset.id;
    removeFromMyDex(id); // 로컬스토리지에서 제거
    renderMyDexModal(); // UI 다시 렌더링
  }
});

// ===== 마이덱스 모달 렌더링 함수 =====
export function renderMyDexModal() {
  container.innerHTML = ""; // 기존 내용 초기화
  const dex = loadMyDex(); // 로컬스토리지에서 마이덱스 불러오기

  // ===== 마이덱스가 비었을 경우 처리 =====
  if (dex.length === 0) {
    container.innerHTML =
      '<p class="not-saved">아직 저장된 포켓몬이 없어요!</p>';
    return;
  }

  // ===== 문서 조각(DocumentFragment) 생성 =====
  // 여러 DOM 요소를 한 번에 추가하여 렌더링 성능 향상
  const fragment = document.createDocumentFragment();

  dex.forEach((pokemon) => {
    const card = document.createElement("div");
    card.className = "dex-card";

    // 카드 내용 구성
    card.innerHTML = `
      <img src="${pokemon.image}" alt="${pokemon.name}">
      <p>${pokemon.name}</p>
      <button class="remove" data-id="${pokemon.id}" aria-label="포켓몬 삭제">❌</button>
    `;

    fragment.appendChild(card);
  });

  // 문서 조각을 한 번에 container에 추가
  container.appendChild(fragment);
}
