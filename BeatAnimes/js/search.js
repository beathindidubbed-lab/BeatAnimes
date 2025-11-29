// Api urls
const searchapi = "/search/";

// Api Server Manager
const AvailableServers = ["https://beatanimesapi.onrender.com"];

function getApiServer() {
    return AvailableServers[Math.floor(Math.random() * AvailableServers.length)];
}

// Useful functions
async function getJson(path, errCount = 0) {
    const ApiServer = getApiServer();
    let url = ApiServer + path;

    if (errCount > 2) {
        throw new Error(`Too many errors while fetching ${url}`);
    }

    try {
        const _url_of_site = new URL(window.location.href);
        const referer = _url_of_site.origin;
        const response = await fetch(url, { 
            headers: { referer: referer },
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (errors) {
        console.error("Fetch error:", errors);
        return getJson(path, errCount + 1);
    }
}

async function RefreshLazyLoader() {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const lazyImage = entry.target;
                if (lazyImage.dataset.src) {
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove("lzy_img");
                    imageObserver.unobserve(lazyImage);
                }
            }
        });
    }, {
        rootMargin: "50px"
    });
    
    const arr = document.querySelectorAll("img.lzy_img");
    arr.forEach((v) => {
        imageObserver.observe(v);
    });
}

function sentenceCase(str) {
    if (!str || str === null || str === "") return "";
    str = str.toString();
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

let hasNextPage = true;

// Search function to get anime from gogo
async function SearchAnime(query, page = 1) {
    try {
        const data = await getJson(searchapi + encodeURIComponent(query) + "?page=" + page);

        if (!data || !data.results) {
            throw new Error("No results found");
        }

        const animes = data.results;
        const contentdiv = document.getElementById("latest2");
        const loader = document.getElementById("load");
        
        if (!contentdiv) {
            throw new Error("Content div not found");
        }

        if (!Array.isArray(animes) || animes.length === 0) {
            if (page === 1) {
                throw new Error("No results found");
            }
            return false; // No more results
        }

        let html = "";

        for (let i = 0; i < animes.length; i++) {
            const anime = animes[i];
            if (!anime) continue;
            
            const title = anime.title || "Unknown Anime";
            const id = anime.id || "";
            const url = "./anime.html?anime_id=" + encodeURIComponent(id);
            const image = anime.image || anime.img || "./static/loading1.gif";
            const releaseDate = anime.releaseDate || anime.released || "Unknown";
            
            let subOrDub = "SUB";
            if (title.toLowerCase().includes("dub")) {
                subOrDub = "DUB";
            }

            html += `<a href="${url}">
                <div class="poster la-anime">
                    <div id="shadow1" class="shadow">
                        <div class="dubb">${subOrDub}</div>
                    </div>
                    <div id="shadow2" class="shadow">
                        <img class="lzy_img" src="./static/loading1.gif" data-src="${image}" 
                             onerror="this.src='./static/loading1.gif'" alt="${title}">
                    </div>
                    <div class="la-details">
                        <h3>${sentenceCase(title)}</h3>
                        <div id="extra">
                            <span>${releaseDate}</span>
                        </div>
                    </div>
                </div>
            </a>`;
        }
        
        contentdiv.innerHTML += html;

        if (loader) loader.style.display = "none";
        contentdiv.style.display = "block";

        return data.hasNextPage !== false;
    } catch (error) {
        console.error("Search error:", error);
        throw error;
    }
}

const params = new URLSearchParams(window.location.search);
const query = params.get("query");
let page = 1;

if (!query || query.trim() === "") {
    window.location.replace("./index.html");
}

const latestEl = document.getElementById("latest");
if (latestEl) {
    latestEl.innerHTML = `Search Results: ${query}`;
}

// Load more results on scroll
window.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollPosition >= documentHeight - 100) {
        if (hasNextPage) {
            page += 1;
            SearchAnime(query, page).then((hasMore) => {
                hasNextPage = hasMore;
                RefreshLazyLoader();
                console.log("Search animes loaded - page", page);
            }).catch(err => {
                console.error("Failed to load more results:", err);
                hasNextPage = false;
            });
        }
    }
});

async function loadData() {
    try {
        const hasMore = await SearchAnime(query, page);
        hasNextPage = hasMore;
        RefreshLazyLoader();
        console.log("Initial search results loaded");
    } catch (err) {
        console.error("Search failed:", err);
        
        const mainSection = document.getElementById("main-section");
        const errorPage = document.getElementById("error-page");
        const errorDesc = document.getElementById("error-desc");
        const loader = document.getElementById("load");
        
        if (mainSection) mainSection.style.display = "none";
        if (errorPage) errorPage.style.display = "block";
        if (loader) loader.style.display = "none";
        
        if (errorDesc) {
            errorDesc.innerHTML = err.message || "Search failed. Please try again.";
        }
    }
}

loadData();
