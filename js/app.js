// app.js
// 포켓몬 도감 웹사이트 메인 JS
// - 검색 기능, 전체 포켓몬 보기, 마이덱스 관리, 모달 처리 등을 담당

import MiniAlert from "./modules/mini-alert.js"; // 커스텀 알림 모듈
import { showAllPokemon } from "./modules/allpokemon.js"; // 전체 포켓몬 보기 모듈
import { addToMyDex, loadMyDex, removeFromMyDex } from "./modules/mydex.js"; // 마이덱스 관련 모듈

document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------
  // 1️⃣ DOM 요소 선택
  // ----------------------------
  const form = document.getElementById("search-form");
  const searchInput = document.getElementById("search-pokemon");
  const searchBtn = document.getElementById("search-btn");
  const pokemonCard = document.getElementById("pokemon-card"); // 검색/상세 결과 카드
  const loadingBackdrop = document.getElementById("loading-backdrop"); // 로딩 오버레이
  const menuBtn = document.getElementById("menu-btn");
  const headerMenu = document.getElementById("header-menu");

  const modalAllpokemon = document.getElementById("modal-allpokemon"); // 전체 포켓몬 모달
  const allPokemonCard = document.getElementById("all-pokemon-card");
  const closeAllBtn = modalAllpokemon.querySelector(".close");

  const myDexModal = document.getElementById("modal-mydex"); // 마이덱스 모달
  const myDexContainer = document.getElementById("pokemon-mydex");
  const closeMyDexBtn = document.querySelector(".closemydex");

  const detailModal = document.getElementById("modal-detail"); // 상세 포켓몬 모달
  const pokemonDetailContainer = document.getElementById("pokemon-detail");

  // ----------------------------
  // 2️⃣ 캐시 객체
  // ----------------------------
  // 타입, 능력치 이름을 캐싱해서 불필요한 fetch 호출 방지
  const typeCache = {};
  const statCache = {};

  // ----------------------------
  // 3️⃣ 모달 & 메뉴 이벤트
  // ----------------------------
  showAllPokemon(modalAllpokemon, allPokemonCard, showPokemonDetail);

  // 모달 닫기 공통 함수 (클릭 & ESC 키)
  function bindModal(modal, closeBtn) {
    // 닫기 버튼 클릭
    closeBtn.addEventListener("click", () => modal.close());
    // 모달 외부 클릭
    modal.addEventListener("click", (e) => e.target === modal && modal.close());
    // ESC 키
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.open) modal.close();
    });
  }
  bindModal(modalAllpokemon, closeAllBtn);
  bindModal(myDexModal, closeMyDexBtn);

  // 메뉴 토글
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // 이벤트 전파 방지
    headerMenu.classList.toggle("active");
    document.body.classList.toggle("no-scroll"); // 배경 스크롤 방지
  });

  // 마이덱스 열기 버튼
  document
    .querySelector('[data-modal="mydex"]')
    .addEventListener("click", () => {
      renderMyDex(); // 마이덱스 UI 렌더링
      myDexModal.showModal();
      myDexModal.querySelector("button")?.focus(); // 포커스 이동
    });

  // ----------------------------
  // 4️⃣ 이벤트 위임
  // ----------------------------
  document.addEventListener("click", (e) => {
    // ❤️ 마이덱스 추가 버튼 클릭
    if (e.target.classList.contains("heart-btn")) {
      const pokemon = {
        id: e.target.dataset.id,
        name: e.target.dataset.name,
        image: e.target.dataset.image,
      };
      addToMyDex(pokemon);
      renderMyDex(); // 마이덱스 갱신
      MiniAlert.fire({
        title: "저장 완료!",
        message: `${pokemon.name}이(가) 마이덱스에 추가되었습니다! ❤️`,
      });
    }

    // ❌ 마이덱스 삭제 버튼 클릭
    if (e.target.classList.contains("remove")) {
      removeFromMyDex(e.target.dataset.id);
      renderMyDex(); // 마이덱스 갱신
    }
  });

  // ----------------------------
  // 5️⃣ 헬퍼 함수
  // ----------------------------
  // URL을 통해 한국어 이름 가져오기 (캐시 적용)
  async function fetchKoName(url, cache) {
    if (cache[url]) return cache[url];
    const res = await fetch(url);
    const data = await res.json();
    const koName = data.names?.find((n) => n.language.name === "ko")?.name;
    cache[url] = koName || data.name || "";
    return cache[url];
  }

  // 포켓몬 카드 HTML 생성 (검색 결과 및 상세 모달 공용)
  function renderPokemonCard(pokemon) {
    return `
      <div class="pokemon">
        <h2>${pokemon.koreanName} (#${pokemon.id})</h2>
        <img src="${pokemon.sprites.front_default}" alt="${
      pokemon.koreanName
    }" />
        <p>키: ${pokemon.height / 10} m</p>
        <p>몸무게: ${pokemon.weight / 10} kg</p>
        <p>타입: ${pokemon.koreanTypes.join(", ")}</p>
        <p>능력치:</p>
        <ul>
          ${pokemon.koreanStats
            .map((s) => `<li>${s.name}: ${s.value}</li>`)
            .join("")}
        </ul>
        <button class="heart-btn" 
          aria-label="마이덱스 추가"
          data-id="${pokemon.id}" 
          data-name="${pokemon.koreanName}" 
          data-image="${pokemon.sprites.front_default}">
        </button>
      </div>
    `;
  }

  // 배열의 모든 아이템을 fetch 후 한국어 이름으로 변환
  async function mapAsyncToKo(items, cache) {
    return Promise.all(
      items.map(async (item) => await fetchKoName(item.url, cache))
    );
  }

  // ----------------------------
  // 6️⃣ 검색 기능
  // ----------------------------
  async function searchPokemon() {
    const name = searchInput.value.trim().toLowerCase();
    if (!name) {
      MiniAlert.fire({
        title: "Warning!",
        message: "포켓몬 이름을 입력하세요.",
      });
      return;
    }

    // 로딩 UI
    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";
    searchBtn.setAttribute("aria-busy", "true");
    loadingBackdrop.classList.add("show");

    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
      if (!res.ok) throw new Error("포켓몬 없음");
      const pokemon = await res.json();

      // species에서 한국어 이름 가져오기
      const speciesRes = await fetch(pokemon.species.url);
      const species = await speciesRes.json();
      pokemon.koreanName =
        species.names.find((n) => n.language.name === "ko")?.name ||
        pokemon.name;

      // 타입/능력치 한국어 변환
      pokemon.koreanTypes = await mapAsyncToKo(
        pokemon.types.map((t) => t.type),
        typeCache
      );
      const statsKoNames = await mapAsyncToKo(
        pokemon.stats.map((s) => s.stat),
        statCache
      );
      pokemon.koreanStats = statsKoNames.map((name, i) => ({
        name,
        value: pokemon.stats[i].base_stat,
      }));

      // UI 렌더링
      pokemonCard.innerHTML = renderPokemonCard(pokemon);
      pokemonCard.classList.add("show");
    } catch (err) {
      console.error(err);
      MiniAlert.fire({
        title: "Not Found",
        message: "포켓몬이 존재하지 않습니다.",
      });
      pokemonCard.classList.remove("show");
    } finally {
      searchBtn.disabled = false;
      searchBtn.textContent = "검색";
      searchBtn.removeAttribute("aria-busy");
      loadingBackdrop.classList.remove("show");
    }
  }

  // 폼 제출 시 검색 실행
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    searchPokemon();
  });

  // ----------------------------
  // 7️⃣ 상세 모달
  // ----------------------------
  async function showPokemonDetail(pokemon) {
    // 타입/능력치 한국어 변환
    pokemon.koreanTypes = await mapAsyncToKo(
      pokemon.types.map((t) => t.type),
      typeCache
    );
    const statsKoNames = await mapAsyncToKo(
      pokemon.stats.map((s) => s.stat),
      statCache
    );
    pokemon.koreanStats = statsKoNames.map((name, i) => ({
      name,
      value: pokemon.stats[i].base_stat,
    }));

    // 상세 모달 렌더링
    pokemonDetailContainer.innerHTML = renderPokemonCard(pokemon);
    detailModal.showModal();
    detailModal.querySelector("button")?.focus(); // 포커스 이동
  }

  // ----------------------------
  // 8️⃣ 마이덱스 렌더링
  // ----------------------------
  function renderMyDex() {
    const dex = loadMyDex();
    myDexContainer.innerHTML = dex.length
      ? dex
          .map(
            (p) => `
        <div class="dex-card">
          <img src="${p.image}" alt="${p.name}" />
          <p>${p.name}</p>
          <button class="remove" data-id="${p.id}" aria-label="마이덱스 제거">❌</button>
        </div>`
          )
          .join("")
      : "<p>저장된 포켓몬이 없습니다.</p>";
  }
});
