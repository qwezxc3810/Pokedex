import MiniAlert from "./mini-alert.js";

const form = document.getElementById("search-form");
const searchInput = document.getElementById("search-pokemon");
const searchBtn = document.getElementById("search-btn");
const pokemonCard = document.querySelector("#pokemon-card");

const cache = new Map(); // 메모리 캐시
let currentController = null;

// 이벤트
searchBtn.addEventListener("click", searchPokemon);
searchInput.addEventListener("keydown", (e) => {
  if (e.code === "Enter") {
    //폼 제출 방지
    e.preventDefault();

    searchPokemon();
  }
});

async function searchPokemon() {
  const pokemonName = searchInput.value.trim().toLowerCase();
  if (!pokemonName) {
    MiniAlert.fire({
      title: "Warning!!!",
      message: "포켓몬의 이름을 입력해 주세요.",
    });
    return;
  }

  try {
    const res = await fetch("https://graphql-pokeapi.vercel.app/api/graphql", {
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
          sprites {
            front_default
          }
          types {
            type {
              name
            }
          }
        }
      }
    `,
        variables: {
          name: pokemonName,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP 오류: ${res.status}`);
    }
    const data = await res.json();

    if (!data.data?.pokemon) {
      MiniAlert.fire({
        title: "Not Found",
        message: "존재하지 않는 포켓몬입니다. 이름을 다시 확인해 주세요.",
      });
      pokemonCard.classList.remove("show");
      return;
    }
    // 배포할땐 제거
    console.log(data);

    const pokemon = data.data.pokemon;

    pokemonCard.innerHTML = `
    <li>
    <h2>${pokemon.name} (#${pokemon.id})</h2>
    <img src = "${pokemon.sprites.front_default}" alt="${pokemon.name}">
    <div>
    <p>Height: ${pokemon.height}</p>
    <p>Weight: ${pokemon.weight}</p>
    <p>Type: ${pokemon.types.map((t) => t.type.name).join(",")}</p>
    </div>
    </li>`;
    pokemonCard.classList.add("show");
  } catch (err) {
    console.error("오류 발생:", err);
    MiniAlert.fire({
      title: "Error!!!",
      message: "포켓몬 정보를 가져오는 데 실패했습니다.",
    });
  }
}
