// mydex.js
// 로컬스토리지를 활용한 마이덱스 관리 함수 모음

// ===== 마이덱스 불러오기 =====
export function loadMyDex() {
  // 로컬스토리지에 저장된 "myDex" 가져오기
  // 없으면 빈 배열 반환
  return JSON.parse(localStorage.getItem("myDex") || "[]");
}

// ===== 마이덱스에 포켓몬 추가 =====
export function addToMyDex(pokemon) {
  const dex = loadMyDex(); // 현재 마이덱스 불러오기

  // 중복 체크: 이미 존재하는 ID면 추가하지 않음
  if (!dex.find((p) => p.id == pokemon.id)) {
    dex.push(pokemon); // 새 포켓몬 추가
    localStorage.setItem("myDex", JSON.stringify(dex)); // 로컬스토리지 저장
  }
}

// ===== 마이덱스에서 포켓몬 제거 =====
export function removeFromMyDex(id) {
  const dex = loadMyDex().filter((p) => p.id != id); // ID 기준 필터링
  localStorage.setItem("myDex", JSON.stringify(dex)); // 로컬스토리지 저장
}
