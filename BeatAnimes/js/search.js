const searchapi = "/search/";
const AvailableServers = ["https://beatanimesapi-h6gt.onrender.com"];

function getApiServer() {
    return AvailableServers[Math.floor(Math.random() * AvailableServers.length)];
}

async function getJson(path, errCount = 0) {
    const ApiServer = getApiServer();
    if (errCount > 2) throw new Error(`Too many errors`);

    try {
        const response = await fetch(ApiServer + path, { 
            headers: { referer: window.location.origin },
            cache: 'no-cache'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (errors) {
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
    }, { rootMargin: "50px" });
    
    document.querySelectorAll("img.lzy_img").forEach(v => imageObserver.observe(v));
}

function sentenceCase(str) {
    if (!str) return "";
    return str.toString().replace(/\w\S*/g, txt => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

let hasNextPage = true;

// FIX: Show "Not Found" message instead of error
async function SearchAnime(query, page = 1) {
    try {
        const data = await getJson(searchapi + encodeURIComponent(query) + "?page=" + page);

        let animes = [];
        if (data?.results?.results) animes = data.results.results;
        else if (data?.results) animes = data.results;
        else if (Array.isArray(data)) animes = data;

        const contentdiv = document.getElementById("latest2");
        const loader = document.getElementById("load");

        if (animes.length === 0) {
            if (page === 1) {
                // Show "Not Found" message instead of error
                contentdiv.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; width: 100%;">
                        <i class="fa fa-search" style="font-size: 80px; color: #eb3349; margin-bottom: 20px;"></i>
                        <h2 style="color: white; font-family: 'Montserrat', sans-serif; margin-bottom: 15px;">
                            No Results Found
                        </h2>
                        <p style="color: #999; font-family: 'Montserrat', sans-serif; font-size: 16px; margin-bottom: 25px;">
                            We couldn't find any anime matching "<strong style="color: #eb3349;">${query}</strong>"
                        </p>
                        <p style="color: #999; font-family: 'Montserrat', sans-serif; font-size: 14px; margin-bottom: 20px;">
                            Try searching with:
                        </p>
                        <ul style="color: #999; text-align: left; max-width: 400px; margin: 0 auto; list-style: none; padding: 0;">
                            <li style="margin: 10px 0;"><i class="fa fa-check" style="color: #eb3349; margin-right: 10px;"></i>Different keywords</li>
                            <li style="margin: 10px 0;"><i class="fa fa-check" style="color: #eb3349; margin-right: 10px;"></i>English or Japanese title</li>
                            <li style="margin: 10px 0;"><i class="fa fa-check" style="color: #eb3349; margin-right: 10px;"></i>Fewer words</li>
                        </ul>
                        <a href="./index.html" style="display: inline-block; margin-top: 30px; background: linear-gradient(to right, #eb3349, #f45c43); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-family: 'Montserrat', sans-serif;">
                            <i class="fa fa-home"></i> Back to Home
                        </a>
                    </div>
                `;
                contentdiv.style.display = "block";
                if (loader) loader.style.display = "none";
                return false;
            }
            return false;
        }

        let html = "";
        for (let anime of animes) {
            if (!anime) continue;
            
            const title = anime.title || "Unknown";
            const id = anime.id || "";
            const url = "./anime.html?anime_id=" + encodeURIComponent(id);
            const image = anime.image || "./static/loading1.gif";
            const releaseDate = anime.releaseDate || anime.released || "Unknown";
            const subOrDub = title.toLowerCase().includes("dub") ? "DUB" : "SUB";

            html += `<a href="${url}">
                <div class="poster la-anime">
                    <div id="shadow1" class="shadow">
                        <div class="dubb">${subOrDub}</div>
                    </div>
                    <div id="shadow2" class="shadow">
                        <img class="lzy_img" src="./static/loading1.gif" data-src="${image}" 
                             onerror="this.src='./static/loading1.gif'">
                    </div>
                    <div class="la-details">
                        <h3>${sentenceCase(title)}</h3>
                        <div id="extra"><span>${releaseDate}</span></div>
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

document.getElementById("latest").innerHTML = `Search Results: ${query}`;

let isLoadingMore = false;

window.addEventListener("scroll", () => {
    if (isLoadingMore || !hasNextPage) return;
    
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollPosition >= documentHeight - 100) {
        isLoadingMore = true;
        page++;
        
        SearchAnime(query, page).then((hasMore) => {
            hasNextPage = hasMore;
            RefreshLazyLoader();
            isLoadingMore = false;
        }).catch(() => {
            hasNextPage = false;
            isLoadingMore = false;
        });
    }
});

async function loadData() {
    try {
        const hasMore = await SearchAnime(query, page);
        hasNextPage = hasMore;
        RefreshLazyLoader();
    } catch (err) {
        console.error("Search failed:", err);
        document.getElementById("latest2").innerHTML = `
            <div style="text-align: center; padding: 40px; width: 100%;">
                <h2 style="color: #eb3349;">Search Failed</h2>
                <p style="color: white;">Please try again</p>
            </div>
        `;
        document.getElementById("load").style.display = "none";
    }
}

loadData();

