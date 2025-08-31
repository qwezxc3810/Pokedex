import MiniAlert from "./mini-alert.js";
import { showAllPokemon } from "./allpokemon.js";
import { addToMyDex, loadMyDex, removeFromMyDex } from "./mydex.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("search-form");
  const searchInput = document.getElementById("search-pokemon");
  const searchBtn = document.getElementById("search-btn");
  const pokemonCard = document.getElementById("pokemon-card");
  const loadingBackdrop = document.getElementById("loading-backdrop");
  const menuBtn = document.getElementById("menu-btn");
  const headerMenu = document.getElementById("header-menu");

  const modalAllpokemon = document.getElementById("modal-allpokemon");
  const allPokemonCard = document.getElementById("all-pokemon-card");
  const closeBtn = modalAllpokemon.querySelector(".close");

  const myDexModal = document.getElementById("modal-mydex");
  const myDexContainer = document.getElementById("pokemon-mydex");
  const closeMyDexBtn = document.querySelector(".closemydex");

  const detailModal = document.getElementById("modal-detail");
  const pokemonDetailContainer = document.getElementById("pokemon-detail");

  // 전체 포켓몬 클릭 시
  showAllPokemon(modalAllpokemon, allPokemonCard, showPokemonDetail);

  // 모달 닫기
  closeBtn.addEventListener("click", () => modalAllpokemon.close());
  modalAllpokemon.addEventListener("click", (e) => {
    if (e.target === modalAllpokemon) modalAllpokemon.close();
  });

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    headerMenu.classList.toggle("active");
    document.body.classList.toggle("no-scroll");
  });

  document
    .querySelector('[data-modal="mydex"]')
    .addEventListener("click", () => {
      renderMyDex();
      myDexModal.showModal();
    });

  closeMyDexBtn.addEventListener("click", () => myDexModal.close());
  myDexModal.addEventListener("click", (e) => {
    if (e.target === myDexModal) myDexModal.close();
  });

  // ❤️ 버튼 클릭 이벤트
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("heart-btn")) {
      const pokemon = {
        id: e.target.dataset.id,
        name: e.target.dataset.name,
        image: e.target.dataset.image,
      };
      addToMyDex(pokemon);
      renderMyDex();
      MiniAlert.fire({
        title: "저장 완료!",
        message: `${pokemon.name}이(가) 마이덱스에 추가되었습니다! ❤️`,
      });
    }

    if (e.target.classList.contains("remove")) {
      removeFromMyDex(e.target.dataset.id);
      renderMyDex();
    }
  });

  async function searchPokemon() {
    const name = searchInput.value.trim().toLowerCase();
    if (!name) {
      MiniAlert.fire({
        title: "Warning!",
        message: "포켓몬 이름을 입력하세요.",
      });
      return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";
    loadingBackdrop.classList.add("show");

    try {
      // 영어 → ID 조회 후 species에서 한국어 이름 불러오기
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
      if (!res.ok) throw new Error("포켓몬 없음");
      const pokemon = await res.json();

      // species에서 한국어 이름 가져오기
      const speciesRes = await fetch(pokemon.species.url);
      const species = await speciesRes.json();
      const koreanName =
        species.names.find((n) => n.language.name === "ko")?.name ||
        pokemon.name;
      pokemon.koreanName = koreanName;

      // 타입 한국어 변환
      const types = await Promise.all(
        pokemon.types.map(async (t) => {
          const typeRes = await fetch(t.type.url);
          const typeData = await typeRes.json();
          const ko = typeData.names.find((n) => n.language.name === "ko");
          return ko ? ko.name : t.type.name;
        })
      );
      pokemon.koreanTypes = types;

      // 능력치 한국어 변환
      const stats = await Promise.all(
        pokemon.stats.map(async (s) => {
          const statRes = await fetch(s.stat.url);
          const statData = await statRes.json();
          const ko = statData.names.find((n) => n.language.name === "ko");
          return {
            name: ko ? ko.name : s.stat.name,
            value: s.base_stat,
          };
        })
      );
      pokemon.koreanStats = stats;

      pokemonCard.innerHTML = renderPokemon(pokemon);
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
      loadingBackdrop.classList.remove("show");
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    searchPokemon();
  });

  function renderPokemon(pokemon) {
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
          data-id="${pokemon.id}" 
          data-name="${pokemon.koreanName}" 
          data-image="${pokemon.sprites.front_default}">
        </button>
      </div>
    `;
  }

  async function showPokemonDetail(pokemon) {
    // 타입 한국어 변환
    const types = await Promise.all(
      pokemon.types.map(async (t) => {
        const typeRes = await fetch(t.type.url);
        const typeData = await typeRes.json();
        const ko = typeData.names.find((n) => n.language.name === "ko");
        return ko ? ko.name : t.type.name;
      })
    );

    // 능력치 한국어 변환
    const stats = await Promise.all(
      pokemon.stats.map(async (s) => {
        const statRes = await fetch(s.stat.url);
        const statData = await statRes.json();
        const ko = statData.names.find((n) => n.language.name === "ko");
        return {
          name: ko ? ko.name : s.stat.name,
          value: s.base_stat,
        };
      })
    );

    pokemonDetailContainer.innerHTML = `
      <h2>${pokemon.koreanName || pokemon.name} (#${pokemon.id})</h2>
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.koreanName}" />
      <p>타입: ${types.join(", ")}</p>
      <p>키: ${pokemon.height / 10} m</p>
      <p>몸무게: ${pokemon.weight / 10} kg</p>
      <p>능력치:</p>
      <ul>
        ${stats.map((s) => `<li>${s.name}: ${s.value}</li>`).join("")}
      </ul>
      <button class="heart-btn" 
        data-id="${pokemon.id}" 
        data-name="${pokemon.koreanName}" 
        data-image="${pokemon.sprites.front_default}">
        ❤️ 마이덱스 추가
      </button>
    `;

    detailModal.showModal();
  }

  function renderMyDex() {
    const dex = loadMyDex();
    myDexContainer.innerHTML = dex.length
      ? dex
          .map(
            (p) => `
        <div class="dex-card">
          <img src="${p.image}" alt="${p.name}" />
          <p>${p.name}</p>
          <button class="remove" data-id="${p.id}">❌</button>
        </div>`
          )
          .join("")
      : "<p>저장된 포켓몬이 없습니다.</p>";
  }
});
