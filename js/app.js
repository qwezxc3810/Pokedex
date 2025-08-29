import MiniAlert from "./mini-alert.js";
// MiniAlert 모듈 불러오기
// 알림 팝업 띄울 때 사용 (경고, 오류, 정보 등)

document.addEventListener("DOMContentLoaded", () => {
  // HTML 문서가 완전히 로드되고 DOM이 준비되면 실행
  const form = document.getElementById("search-form");
  // 검색 폼 요소
  const searchInput = document.getElementById("search-pokemon");
  // 인풋 요소
  const searchBtn = document.getElementById("search-btn");
  // 검색 버튼 요소
  const pokemonCard = document.querySelector("#pokemon-card");
  // 결과 카드 요소
  const loadingBackdrop = document.getElementById("loading-backdrop");
  // 로딩 중 백드롭
  const menuBtn = document.getElementById("menu-btn");
  // 헤더 햄버거 메뉴
  const headerMenu = document.getElementById("header-menu");

  // 메뉴 버튼 이벤트
  menuBtn.addEventListener("click", () => {
    headerMenu.classList.toggle("active");
    // 메뉴 활성화
    document.body.classList.toggle("no-scroll"); 
    // 스크롤 방지
  });

  // 헤더 메뉴
  async function searchPokemon() {
    // 포켓몬 검색 비동기
    const pokemonName = searchInput.value.trim().toLowerCase();
    // 입력 값에서 공백 제거 후 소문자로 변환
    // API 요청 시 이름이 소문자여야 정상 작동

    if (!pokemonName) {
      // 입력값이 공란이면 경고
      MiniAlert.fire({
        title: "Warning!!!",
        message: "포켓몬의 이름을 입력해 주세요.",
      });
      return;
    }

    // 버튼 비활성화 + 로딩 표시
    searchBtn.disabled = true; // 검색 중일때 버튼 클릭 방지
    const originalText = searchBtn.textContent; // 버튼 원래 텍스트 저장
    searchBtn.textContent = "Loading..."; // 버튼 텍스트 변경
    loadingBackdrop.classList.add("show"); // 로딩 화면 표시

    try {
      // GraphQL API에 포켓몬 정보 요청
      const res = await fetch(
        "https://graphql-pokeapi.vercel.app/api/graphql",
        {
          method: "POST", // GraphQL은 POST 방식으로 요청
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
            }
          `,
            variables: { name: pokemonName }, // 입력한 포켓몬 이름 변수로 전달
          }),
        }
      );

      if (!res.ok) throw new Error(`HTTP 오류: ${res.status}`); // 서버에서 정상 응답이 아니면 에러 처리

      const data = await res.json(); // JSON 형식으로 응답 데이터 파싱

      // 포켓몬이 없거나 sprites 정보가 없으면 Not Found 처리
      if (!data.data?.pokemon || !data.data.pokemon.sprites?.front_default) {
        MiniAlert.fire({
          title: "Not Found",
          message: "존재하지 않는 포켓몬입니다. 이름 또는 ID를 다시 확인해 주세요.",
        });
        pokemonCard.classList.remove("show"); // 기존 카드 숨김
        return;
      }

      const pokemon = data.data.pokemon;
      // API에서 받아온 포켓몬 정보 객체
      pokemonCard.innerHTML = renderPokemon(pokemon);
      // HTML을 동적으로 생성하여 카드에 표시
      pokemonCard.classList.add("show");
      // 카드 표시
    } catch (err) {
      console.error("오류 발생:", err);
      // 콘솔에 오류 출력 (개발용, 배포 시 제거)
      MiniAlert.fire({
        title: "Error!!!",
        message: "포켓몬 정보를 가져오는 데 실패했습니다.",
      }); // 사용자에게 오류 알림
    } finally {
      // 성공/실패 상관없이 항상 실행

      searchBtn.disabled = false; // 버튼 다시 활성화

      searchBtn.textContent = originalText; // 버튼 원래 텍스트 복원

      loadingBackdrop.classList.remove("show"); // 로딩 화면 숨김
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // 폼 제출 시 페이지 새로고침 방지
    searchPokemon();
    // 포켓몬 검색 함수 호출
  });

  function renderPokemon(pokemon) {
    // 포켓몬 정보를 카드 HTML로 변환하는 함수

    return `
      <div class="pokemon">
        <h2>${pokemon.name} (#${pokemon.id})</h2>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <div>
          <p>Height: ${pokemon.height}</p>
          <p>Weight: ${pokemon.weight}</p>
          <p>Type: ${pokemon.types.map((t) => t.type.name).join(", ")}</p>
        </div>
      </div>
    `;
  }
});
