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
      const res = await fetch(
        "https://graphql-pokeapi.vercel.app/api/graphql",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
          query getPokemon($name: String!) {
            pokemon(name: $name) {
              id
              name
              height
              weight
              sprites { front_default }
              types { type { name } }
            }
          }`,
            variables: { name },
          }),
        }
      );

      const data = await res.json();
      if (!data.data?.pokemon) {
        MiniAlert.fire({
          title: "Not Found",
          message: "포켓몬이 존재하지 않습니다.",
        });
        pokemonCard.classList.remove("show");
        return;
      }

      const pokemon = data.data.pokemon;
      pokemonCard.innerHTML = renderPokemon(pokemon);
      pokemonCard.classList.add("show");
    } catch (err) {
      console.error(err);
      MiniAlert.fire({
        title: "Error",
        message: "데이터를 가져오는데 실패했습니다.",
      });
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
        <h2>${pokemon.name} (#${pokemon.id})</h2>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" />
        <p>Height: ${pokemon.height}</p>
        <p>Weight: ${pokemon.weight}</p>
        <p>Type: ${pokemon.types.map((t) => t.type.name).join(", ")}</p>
        <button class="heart-btn" 
          data-id="${pokemon.id}" 
          data-name="${pokemon.name}" 
          data-image="${pokemon.sprites.front_default}">
        </button>
      </div>
    `;
  }

  function showPokemonDetail(pokemon) {
    pokemonDetailContainer.innerHTML = `
      <h2>${pokemon.name} (#${pokemon.id})</h2>
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" />
      <p>Type: ${pokemon.types.map((t) => t.type.name).join(", ")}</p>
      <p>Height: ${pokemon.height}</p>
      <p>Weight: ${pokemon.weight}</p>
      <button class="heart-btn" 
        data-id="${pokemon.id}" 
        data-name="${pokemon.name}" 
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
