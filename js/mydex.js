export function loadMyDex() {
  return JSON.parse(localStorage.getItem("myDex") || "[]");
}

export function addToMyDex(pokemon) {
  const dex = loadMyDex();
  if (!dex.find((p) => p.id == pokemon.id)) {
    dex.push(pokemon);
    localStorage.setItem("myDex", JSON.stringify(dex));
  }
}

export function removeFromMyDex(id) {
  const dex = loadMyDex().filter((p) => p.id != id);
  localStorage.setItem("myDex", JSON.stringify(dex));
}
