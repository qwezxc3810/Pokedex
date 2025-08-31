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

        // species에서 한국어 이름 가져오기
        const speciesRes = await fetch(detail.species.url);
        const species = await speciesRes.json();
        const koreanName =
          species.names.find((n) => n.language.name === "ko")?.name ||
          detail.name;

        // 타입 한국어 변환
        const types = await Promise.all(
          detail.types.map(async (t) => {
            const typeRes = await fetch(t.type.url);
            const typeData = await typeRes.json();
            const ko = typeData.names.find((n) => n.language.name === "ko");
            return ko ? ko.name : t.type.name;
          })
        );

        // 능력치 한국어 변환
        const stats = await Promise.all(
          detail.stats.map(async (s) => {
            const statRes = await fetch(s.stat.url);
            const statData = await statRes.json();
            const ko = statData.names.find((n) => n.language.name === "ko");
            return {
              name: ko ? ko.name : s.stat.name,
              value: s.base_stat,
            };
          })
        );

        const card = document.createElement("div");
        card.className = "pokemon-card";
        card.innerHTML = `
          <h3>${koreanName} (#${detail.id})</h3>
          <img src="${detail.sprites.front_default}" alt="${koreanName}">
          <p><b>타입:</b> ${types.join(", ")}</p>
        `;

        // 카드 클릭 → 상세 모달
        card.addEventListener("click", () => {
          showPokemonDetail({
            ...detail,
            koreanName,
            koreanTypes: types,
            koreanStats: stats,
          });
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
    <h2>${detail.koreanName} (#${detail.id})</h2>
    <img src="${detail.sprites.front_default}" alt="${detail.koreanName}">
    <p><b>타입:</b> ${detail.koreanTypes.join(", ")}</p>
    <p><b>키:</b> ${detail.height / 10} m</p>
    <p><b>몸무게:</b> ${detail.weight / 10} kg</p>
    <p><b>능력치:</b></p>
    <ul>
      ${detail.koreanStats
        .map((s) => `<li>${s.name}: ${s.value}</li>`)
        .join("")}
    </ul>
  `;

  modalDetail.showModal();
  modalDetail.querySelector(".closedetail").onclick = () => modalDetail.close();
}
