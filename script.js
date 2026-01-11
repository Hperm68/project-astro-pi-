// ✅ CHANGE THESE:
const OWNER = "Hperm68";
const REPO  = "project-astro-pi-";

// GitHub API paging
const PER_PAGE = 20; // show 20 releases at a time

const root = document.documentElement;
const yearEl = document.getElementById("year");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const moreHint = document.getElementById("moreHint");
const searchEl = document.getElementById("search");
const refreshBtn = document.getElementById("refreshBtn");

const repoLink = document.getElementById("repoLink");
const releasesLink = document.getElementById("releasesLink");
const siteSubtitle = document.getElementById("siteSubtitle");
const themeBtn = document.getElementById("themeBtn");

yearEl.textContent = new Date().getFullYear();

const repoUrl = `https://github.com/${OWNER}/${REPO}`;
repoLink.href = repoUrl;
releasesLink.href = `${repoUrl}/releases`;
siteSubtitle.textContent = `${OWNER}/${REPO}`;

function setStatus(msg){ statusEl.textContent = msg; }

function setTheme(mode){
  if(mode === "light") root.classList.add("light");
  else root.classList.remove("light");
  localStorage.setItem("theme", mode);
}
const savedTheme = localStorage.getItem("theme");
if(savedTheme) setTheme(savedTheme);

themeBtn.addEventListener("click", () => {
  setTheme(root.classList.contains("light") ? "dark" : "light");
});

function fmtMB(bytes){
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}
function fmtDate(iso){
  if(!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
}

function escapeHtml(s){
  return (s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

let page = 1;
let allReleases = [];
let loading = false;
let reachedEnd = false;

async function fetchReleases(pageNum){
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=${PER_PAGE}&page=${pageNum}`;
  const res = await fetch(url, { headers: { "Accept": "application/vnd.github+json" }});
  if(!res.ok){
    throw new Error(`GitHub API error ${res.status}`);
  }
  return await res.json();
}

function matchesSearch(release, q){
  if(!q) return true;
  const hay = `${release.tag_name || ""} ${release.name || ""} ${release.body || ""}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function render(){
  const q = searchEl.value.trim();
  listEl.innerHTML = "";

  const filtered = allReleases.filter(r => matchesSearch(r, q));

  if(filtered.length === 0){
    listEl.innerHTML = `<div class="card">No releases match your search.</div>`;
    return;
  }

  for(const r of filtered){
    const tag = r.tag_name || "(no tag)";
    const name = r.name || tag;
    const published = r.published_at ? `Published: ${fmtDate(r.published_at)}` : "Unpublished draft";
    const prerelease = r.prerelease ? `<span class="pill">Pre-release</span>` : "";
    const draft = r.draft ? `<span class="pill">Draft</span>` : "";

    const zipUrl = r.zipball_url || `${repoUrl}/archive/refs/tags/${tag}.zip`;
    const tarUrl = r.tarball_url || `${repoUrl}/archive/refs/tags/${tag}.tar.gz`;

    const assets = Array.isArray(r.assets) ? r.assets : [];

    const assetsHtml = assets.length ? assets.map(a => `
      <div class="asset">
        <div>
          <div class="asset-name">${escapeHtml(a.name)}</div>
          <div class="asset-sub">${fmtMB(a.size)} • downloads: ${a.download_count}</div>
        </div>
        <a class="btn primary" href="${a.browser_download_url}" target="_blank" rel="noreferrer">Download</a>
      </div>
    `).join("") : `<div class="muted small">No assets attached to this release.</div>`;

    const notes = (r.body && r.body.trim()) ? escapeHtml(r.body) : "(no release notes)";

    const card = document.createElement("article");
    card.className = "card release";
    card.innerHTML = `
      <div class="release-head">
        <div>
          <h2 class="r-title">${escapeHtml(name)}</h2>
          <div class="r-meta"><b>${escapeHtml(tag)}</b> • ${published}</div>
          <div class="pills">
            ${draft}
            ${prerelease}
            <span class="pill">Assets: ${assets.length}</span>
          </div>
        </div>

        <div class="row">
          <a class="btn" href="${r.html_url}" target="_blank" rel="noreferrer">Open</a>
          <a class="btn" href="${zipUrl}" target="_blank" rel="noreferrer">Source .zip</a>
          <a class="btn" href="${tarUrl}" target="_blank" rel="noreferrer">Source .tar.gz</a>
        </div>
      </div>

      <div class="assets">
        ${assetsHtml}
      </div>

      <pre>${notes}</pre>
    `;
    listEl.appendChild(card);
  }
}

async function loadNext(){
  if(loading || reachedEnd) return;
  loading = true;
  setStatus(`Loading releases… (page ${page})`);

  try{
    const chunk = await fetchReleases(page);
    if(!Array.isArray(chunk) || chunk.length === 0){
      reachedEnd = true;
      loadMoreBtn.disabled = true;
      moreHint.textContent = "No more releases.";
      setStatus("Loaded all releases.");
      loading = false;
      return;
    }

    allReleases = allReleases.concat(chunk);
    page += 1;

    setStatus(`Loaded ${allReleases.length} releases.`);
    moreHint.textContent = reachedEnd ? "No more releases." : "Click to load more.";
    render();
  } catch(err){
    setStatus(`Error: ${err.message}`);
    moreHint.textContent = "Repo must be public and have Releases. GitHub API may rate-limit anonymous requests.";
  } finally{
    loading = false;
  }
}

function resetAndLoad(){
  page = 1;
  allReleases = [];
  reachedEnd = false;
  loadMoreBtn.disabled = false;
  listEl.innerHTML = "";
  moreHint.textContent = "";
  loadNext();
}

loadMoreBtn.addEventListener("click", loadNext);
refreshBtn.addEventListener("click", resetAndLoad);

let searchTimer = null;
searchEl.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(render, 120);
});

resetAndLoad();
