// allpokemon.js
// 전체 포켓몬 모달 표시

import MiniAlert from "./mini-alert.js";

// ===== 캐시 객체 =====
// API 호출을 반복하지 않기 위해 캐싱
const typeCache = {}; // 포켓몬 타입 캐시
const statCache = {}; // 포켓몬 능력치 캐시
const speciesCache = {}; // species (한국어 이름) 캐시

// ===== 한국어 이름 가져오기 헬퍼 =====
async function fetchKoName(url, cache) {
  // 이미 캐시에 있으면 바로 반환
  if (cache[url]) return cache[url];
  try {
    const res = await fetch(url);
    const data = await res.json();
    const koName = data.names?.find((n) => n.language.name === "ko")?.name;
    cache[url] = koName || data.name || ""; // 캐시에 저장
    return cache[url];
  } catch (err) {
    console.error("fetchKoName error:", err);
    return "";
  }
}

// ===== 타입 배열 한국어 변환 =====
async function fetchTypes(types) {
  return Promise.all(
    types.map(async (t) => await fetchKoName(t.type.url, typeCache))
  );
}

// ===== 능력치 배열 한국어 변환 =====
async function fetchStats(stats) {
  const koNames = await Promise.all(
    stats.map(async (s) => await fetchKoName(s.stat.url, statCache))
  );
  return koNames.map((name, i) => ({
    name,
    value: stats[i].base_stat,
  }));
}

// ===== 상세 모달 표시 =====
function showPokemonDetail(detail) {
  const modalDetail = document.getElementById("modal-detail");
  const container = document.getElementById("pokemon-detail");

  // 모달 내부 HTML 렌더링
  container.innerHTML = `
    <h2>${detail.koreanName} (#${detail.id})</h2>
    <img src="${detail.sprites.front_default}" alt="${detail.koreanName}">
    <p><b>타입:</b> ${detail.koreanTypes.join(", ")}</p>
    <p><b>키:</b> ${detail.height / 10} m</p>
    <p><b>몸무게:</b> ${detail.weight / 10} kg</p>
    <p><b>능력치:</b></p>
    <ul>${detail.koreanStats
      .map((s) => `<li>${s.name}: ${s.value}</li>`)
      .join("")}</ul>
  `;

  modalDetail.showModal();

  // 닫기 버튼 이벤트
  modalDetail
    .querySelector(".closedetail")
    ?.addEventListener("click", () => modalDetail.close());
}

// ===== 카드 생성 =====
function createPokemonCard(detail) {
  const card = document.createElement("div");
  card.className = "pokemon-card";
  card.tabIndex = 0; // 키보드 접근 가능
  card.innerHTML = `
    <h3>${detail.koreanName} (#${detail.id})</h3>
    <img src="${detail.sprites.front_default}" alt="${detail.koreanName}">
    <p><br>타입:</br> ${detail.koreanTypes.join(", ")}</p>
  `;
  // 클릭 시 상세 모달 열기
  card.addEventListener("click", () => showPokemonDetail(detail));
  // 엔터 키로도 열기 가능
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter") showPokemonDetail(detail);
  });
  return card;
}

// ===== 전체 포켓몬 표시 & 무한 스크롤 =====
export function showAllPokemon(modalAllpokemon, allPokemonCard) {
  const allBtn = document.querySelector("#all-pokemon");
  let offset = 0; // 현재 배치 시작 인덱스
  const limit = 50; // 한 번에 로드할 개수
  let allPokemonList = []; // 전체 리스트
  let loading = false; // 로딩 상태

  // 모달 열기
  allBtn.addEventListener("click", async () => {
    modalAllpokemon.showModal();
    allPokemonCard.innerHTML = "Loading...";
    allPokemonCard.scrollTop = 0; // 맨 위로 초기화

    try {
      // 전체 포켓몬 목록 fetch
      const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
      const data = await res.json();
      allPokemonList = data.results;
      allPokemonCard.innerHTML = "";
      offset = 0;

      // 첫 배치 로딩
      await loadBatch();
    } catch (err) {
      console.error(err);
      allPokemonCard.innerHTML = "데이터 로딩 실패";
      MiniAlert.fire({ title: "Error", message: "포켓몬 로딩 실패" });
    }
  });

  // 스크롤 이벤트 → 무한스크롤
  allPokemonCard.addEventListener("scroll", async () => {
    if (loading) return; // 로딩 중이면 skip
    // 스크롤이 끝에 가까우면 배치 로드
    if (
      allPokemonCard.scrollTop + allPokemonCard.clientHeight >=
      allPokemonCard.scrollHeight - 10
    ) {
      await loadBatch();
    }
  });

  // ===== 배치 로딩 함수 =====
  async function loadBatch() {
    if (offset >= allPokemonList.length) return; // 모든 데이터 로드 완료
    loading = true;
    const batch = allPokemonList.slice(offset, offset + limit);

    // 병렬 fetch로 상세 데이터 가져오기
    const details = await Promise.all(
      batch.map(async (p) => {
        const resDetail = await fetch(p.url);
        const detail = await resDetail.json();
        const koreanName = await fetchKoName(detail.species.url, speciesCache);
        const koreanTypes = await fetchTypes(detail.types);
        const koreanStats = await fetchStats(detail.stats);
        return { ...detail, koreanName, koreanTypes, koreanStats };
      })
    );

    // 카드 DOM에 추가
    details.forEach((d) => allPokemonCard.appendChild(createPokemonCard(d)));
    offset += limit;
    loading = false;
  }

  // 모달 닫기 버튼
  modalAllpokemon.querySelector(".close").onclick = () =>
    modalAllpokemon.close();
}
