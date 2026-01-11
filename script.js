const root = document.documentElement;
const themeBtn = document.getElementById("themeBtn");
const year = document.getElementById("year");
const speedValue = document.getElementById("speedValue");
const editBtn = document.getElementById("editBtn");

year.textContent = new Date().getFullYear();

function setTheme(mode) {
  if (mode === "light") root.classList.add("light");
  else root.classList.remove("light");
  localStorage.setItem("theme", mode);
}

const saved = localStorage.getItem("theme");
if (saved) setTheme(saved);

themeBtn.addEventListener("click", () => {
  const isLight = root.classList.contains("light");
  setTheme(isLight ? "dark" : "light");
});

editBtn.addEventListener("click", () => {
  const val = prompt("Enter final speed in km/s (number only):", speedValue.textContent.trim());
  if (!val) return;
  speedValue.textContent = val.trim();
});
