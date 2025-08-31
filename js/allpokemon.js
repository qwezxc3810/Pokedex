import MiniAlert from "./mini-alert.js";
import { addToMyDex } from "./mydex.js";

export function showAllPokemon(modalAllpokemon, allPokemonCard) {
  const allPokemonBtn = document.querySelector("#all-pokemon");

  allPokemonBtn.addEventListener("click", async () => {
    modalAllpokemon.showModal();
    allPokemonCard.innerHTML = "Loading...";

    try {
      const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
      const data = await res.json();
      allPokemonCard.innerHTML = "";

      for (const p of data.results) {
        const resDetail = await fetch(p.url);
        const detail = await resDetail.json();

        const card = document.createElement("div");
        card.className = "pokemon-card";
        card.innerHTML = `
          <h3>${detail.name} (#${detail.id})</h3>
          <img src="${detail.sprites.front_default}" alt="${detail.name}">
        `;

        // 카드 클릭 → 상세 모달
        card.addEventListener("click", () => {
          showPokemonDetail(detail);
        });

        allPokemonCard.appendChild(card);
      }
    } catch (err) {
      allPokemonCard.innerHTML = "데이터 로딩 실패";
      MiniAlert.fire({ title: "Error", message: "포켓몬 로딩 실패" });
      console.error(err);
    }
  });

  modalAllpokemon.querySelector(".close").onclick = () =>
    modalAllpokemon.close();
}

// 상세 모달 표시
function showPokemonDetail(detail) {
  const modalDetail = document.getElementById("modal-detail");
  const pokemonDetailContainer = document.getElementById("pokemon-detail");

  pokemonDetailContainer.innerHTML = `
    <h2>${detail.name} (#${detail.id})</h2>
    <img src="${detail.sprites.front_default}" alt="${detail.name}">
    <p><b>타입:</b> ${detail.types.map((t) => t.type.name).join(", ")}</p>
    <p><b>키:</b> ${detail.height / 10} m</p>
    <p><b>몸무게:</b> ${detail.weight / 10} kg</p>
    <p><b>능력치:</b> ${detail.stats
      .map((s) => `${s.stat.name}: ${s.base_stat}`)
      .join("<br>")}</p>
  `;

  modalDetail.showModal();
  modalDetail.querySelector(".closedetail").onclick = () => modalDetail.close();
}
