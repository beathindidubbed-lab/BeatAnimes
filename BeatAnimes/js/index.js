const IndexApi = "/home";
const recentapi = "/recent/";

const AvailableServers = ["https://beatanimesapi.onrender.com"];

function getApiServer() {
    return AvailableServers[Math.floor(Math.random() * AvailableServers.length)];
}

async function getJson(path, errCount = 0) {
    const ApiServer = getApiServer();
    let url = ApiServer + path;

    if (errCount > 2) {
        throw new Error(`Too many errors while fetching ${url}`);
    }

    try {
        const response = await fetch(url, { 
            headers: { referer: window.location.origin },
            cache: 'no-cache'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (errors) {
        console.error(errors);
        await new Promise(r => setTimeout(r, 1000 * (errCount + 1)));
        return getJson(path, errCount + 1);
    }
}

// FIX: Extract GogoAnime data from API response structure
function extractGogoData(homeData) {
    // Try multiple possible structures
    if (homeData.popular && Array.isArray(homeData.popular.results)) {
        return homeData.popular.results;
    }
    if (homeData.popular && Array.isArray(homeData.popular)) {
        return homeData.popular;
    }
    if (homeData.gogoPopular && Array.isArray(homeData.gogoPopular)) {
        return homeData.gogoPopular;
    }
    if (homeData.results && homeData.results.popular) {
        return extractGogoData(homeData.results);
    }
    return [];
}

function extractRecentData(homeData) {
    if (homeData.recent && Array.isArray(homeData.recent.results)) {
        return homeData.recent.results;
    }
    if (homeData.recent && Array.isArray(homeData.recent)) {
        return homeData.recent;
    }
    if (homeData.gogoRecent && Array.isArray(homeData.gogoRecent)) {
        return homeData.gogoRecent;
    }
    if (homeData.results && homeData.results.recent) {
        return extractRecentData(homeData.results);
    }
    return [];
}

// Banner with GogoAnime data
async function getTrendingAnimes(gogoPopular) {
    if (!gogoPopular || gogoPopular.length === 0) {
        console.warn("No GogoAnime data for banner");
        return;
    }

    let SLIDER_HTML = "";
    
    for (let pos = 0; pos < Math.min(gogoPopular.length, 10); pos++) {
        let anime = gogoPopular[pos];
        if (!anime || !anime.title || !anime.id) continue;
        
        let title = anime.title;
        let id = anime.id;
        let type = "TV";
        let status = anime.release || "Available";
        let url = "./anime.html?anime_id=" + encodeURIComponent(id);
        let poster = anime.image || "./static/loading1.gif";

        SLIDER_HTML += `<div class="mySlides fade">
            <div class="data-slider">
                <p class="spotlight">#${pos + 1} Spotlight</p>
                <h1>${title}</h1>
                <div class="extra1">
                    <span class="year"><i class="fa fa-play-circle"></i>${type}</span>
                    <span class="year year2"><i class="fa fa-calendar"></i>${status}</span>
                    <span class="cbox cbox1">Available</span>
                    <span class="cbox cbox2">HD</span>
                </div>
                <p class="small-synop">Watch ${title} in HD quality. Click to start watching now!</p>
                <div id="watchh">
                    <a href="${url}" class="watch-btn">
                        <i class="fa fa-play-circle"></i> Watch Now
                    </a>
                    <a href="${url}" class="watch-btn watch-btn2">
                        <i class="fa fa-info-circle"></i> Details<i class="fa fa-angle-right"></i>
                    </a>
                </div>
            </div>
            <div class="shado"><a href="${url}"></a></div>
            <img src="${poster}" onerror="this.src='./static/loading1.gif'" alt="${title}">
        </div>`;
    }

    const container = document.querySelector(".slideshow-container");
    if (container) {
        container.innerHTML = SLIDER_HTML + 
            '<a class="prev" onclick="plusSlides(-1)">&#10094;</a>' +
            '<a class="next" onclick="plusSlides(1)">&#10095;</a>';
    }
}

// Most Popular section
async function getPopularAnimes(gogoPopular) {
    if (!gogoPopular || gogoPopular.length === 0) {
        console.warn("No popular anime data");
        document.querySelector(".popularg").innerHTML = '<p style="color: white; padding: 20px;">No popular anime available</p>';
        return;
    }

    let POPULAR_HTML = "";

    for (let pos = 0; pos < Math.min(gogoPopular.length, 20); pos++) {
        let anime = gogoPopular[pos];
        if (!anime || !anime.title || !anime.id) continue;
        
        let title = anime.title;
        let id = anime.id;
        let url = "./anime.html?anime_id=" + encodeURIComponent(id);
        let image = anime.image || "./static/loading1.gif";
        let subOrDub = title.toLowerCase().includes("dub") ? "DUB" : "SUB";

        POPULAR_HTML += `<a href="${url}">
            <div class="poster la-anime">
                <div id="shadow1" class="shadow">
                    <div class="dubb"># ${pos + 1}</div>
                    <div class="dubb dubb2">${subOrDub}</div>
                </div>
                <div id="shadow2" class="shadow">
                    <img class="lzy_img" src="./static/loading1.gif" data-src="${image}" 
                         onerror="this.src='./static/loading1.gif'" alt="${title}">
                </div>
                <div class="la-details">
                    <h3>${title}</h3>
                </div>
            </div>
        </a>`;
    }

    document.querySelector(".popularg").innerHTML = POPULAR_HTML;
}

// Recent section with initial data
async function initRecentSection(recentData) {
    if (!recentData || recentData.length === 0) {
        console.warn("No recent data from home API");
        return;
    }

    let RECENT_HTML = "";

    for (let anime of recentData) {
        if (!anime) continue;
        
        let title = anime.title || "Unknown";
        let id = (anime.id || "").split("-episode-")[0];
        let url = "./anime.html?anime_id=" + encodeURIComponent(id);
        let image = anime.image || "./static/loading1.gif";
        let ep = String(anime.episode || "").match(/\d+/)?.[0] || "?";
        let subOrDub = title.toLowerCase().includes("dub") ? "DUB" : "SUB";

        RECENT_HTML += `<a href="${url}">
            <div class="poster la-anime">
                <div id="shadow1" class="shadow">
                    <div class="dubb">${subOrDub}</div>
                    <div class="dubb dubb2">EP ${ep}</div>
                </div>
                <div id="shadow2" class="shadow">
                    <img class="lzy_img" src="./static/loading1.gif" data-src="${image}" 
                         onerror="this.src='./static/loading1.gif'">
                </div>
                <div class="la-details">
                    <h3>${title}</h3>
                </div>
            </div>
        </a>`;
    }

    document.querySelector(".recento").innerHTML = RECENT_HTML;
}

// Load more recent anime
let recentPage = 2; // Start from page 2 since page 1 is loaded from /home
let isLoadingRecent = false;
let hasMoreRecent = true;

async function getRecentAnimes(page = 2) {
    if (isLoadingRecent) return;
    
    try {
        isLoadingRecent = true;
        const data = await getJson(recentapi + page);
        
        let results = [];
        if (data?.results?.results) results = data.results.results;
        else if (data?.results) results = data.results;
        else if (Array.isArray(data)) results = data;

        if (results.length === 0) {
            hasMoreRecent = false;
            return false;
        }

        let RECENT_HTML = "";

        for (let anime of results) {
            if (!anime) continue;
            
            let title = anime.title || "Unknown";
            let id = (anime.id || "").split("-episode-")[0];
            let url = "./anime.html?anime_id=" + encodeURIComponent(id);
            let image = anime.image || "./static/loading1.gif";
            let ep = String(anime.episode || "").match(/\d+/)?.[0] || "?";
            let subOrDub = title.toLowerCase().includes("dub") ? "DUB" : "SUB";

            RECENT_HTML += `<a href="${url}">
                <div class="poster la-anime">
                    <div id="shadow1" class="shadow">
                        <div class="dubb">${subOrDub}</div>
                        <div class="dubb dubb2">EP ${ep}</div>
                    </div>
                    <div id="shadow2" class="shadow">
                        <img class="lzy_img" src="./static/loading1.gif" data-src="${image}" 
                             onerror="this.src='./static/loading1.gif'">
                    </div>
                    <div class="la-details">
                        <h3>${title}</h3>
                    </div>
                </div>
            </a>`;
        }

        document.querySelector(".recento").innerHTML += RECENT_HTML;
        RefreshLazyLoader();
        return true;
    } catch (error) {
        console.error("Recent load error:", error);
        hasMoreRecent = false;
        return false;
    } finally {
        isLoadingRecent = false;
    }
}

function createLoadMoreButton() {
    const recentSection = document.querySelector(".recento").parentElement;
    
    const existing = document.getElementById("load-more-btn");
    if (existing) existing.remove();
    
    const btn = document.createElement("button");
    btn.id = "load-more-btn";
    btn.innerHTML = '<i class="fa fa-plus-circle"></i> Load More Anime';
    btn.style.cssText = `
        background: linear-gradient(to right, #eb3349, #f45c43);
        color: white;
        border: none;
        padding: 15px 40px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 50px;
        cursor: pointer;
        margin: 30px auto;
        display: block;
        font-family: "Montserrat", sans-serif;
        box-shadow: 0 4px 15px rgba(235, 51, 73, 0.3);
        transition: all 0.3s;
    `;
    
    btn.onmouseover = () => btn.style.transform = "scale(1.05)";
    btn.onmouseout = () => btn.style.transform = "scale(1)";
    
    btn.onclick = async () => {
        if (!hasMoreRecent) {
            btn.innerHTML = '<i class="fa fa-check-circle"></i> No More Anime';
            btn.disabled = true;
            btn.style.opacity = "0.5";
            return;
        }
        
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Loading...';
        btn.disabled = true;
        
        const hasMore = await getRecentAnimes(recentPage);
        recentPage++;
        
        if (hasMore) {
            btn.innerHTML = '<i class="fa fa-plus-circle"></i> Load More Anime';
            btn.disabled = false;
        } else {
            btn.innerHTML = '<i class="fa fa-check-circle"></i> No More Anime';
            btn.style.opacity = "0.5";
        }
    };
    
    recentSection.appendChild(btn);
}

// Slider functions
let slideIndex = 0;
let clickes = 0;

function showSlides(n) {
    let slides = document.getElementsByClassName("mySlides");
    if (!slides || slides.length === 0) return;
    
    if (n > slides.length) slideIndex = 1;
    if (n < 1) slideIndex = slides.length;
    
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    
    if (slides[slideIndex - 1]) {
        slides[slideIndex - 1].style.display = "flex";
    }
}

async function showSlides2() {
    if (clickes == 1) {
        await new Promise(r => setTimeout(r, 10000));
        clickes = 0;
    }
    
    let slides = document.getElementsByClassName("mySlides");
    if (!slides || slides.length === 0) {
        setTimeout(showSlides2, 5000);
        return;
    }
    
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    
    slideIndex++;
    if (slideIndex > slides.length) slideIndex = 1;
    
    if (slides[slideIndex - 1]) {
        slides[slideIndex - 1].style.display = "flex";
    }
    
    setTimeout(showSlides2, 5000);
}

function plusSlides(n) {
    showSlides((slideIndex += n));
    clickes = 1;
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

// Initialize page
async function initializePage() {
    try {
        document.getElementById("load").style.display = "block";

        console.log("Fetching home data...");
        const data = await getJson(IndexApi);
        console.log("Home API Response:", data);
        
        // Extract data from various possible structures
        let homeData = data.results || data;
        
        const gogoPopular = extractGogoData(homeData);
        const recentData = extractRecentData(homeData);
        
        console.log("Extracted GogoAnime Popular:", gogoPopular.length, "items");
        console.log("Extracted Recent:", recentData.length, "items");

        // Load banner with GogoAnime data
        if (gogoPopular.length > 0) {
            await getTrendingAnimes(gogoPopular);
            slideIndex = 1;
            showSlides(slideIndex);
            showSlides2();
            console.log("✅ Banner loaded");
        } else {
            console.warn("⚠️ No data for banner");
        }

        // Load Most Popular section
        if (gogoPopular.length > 0) {
            await getPopularAnimes(gogoPopular);
            console.log("✅ Popular section loaded");
        } else {
            console.warn("⚠️ No data for popular section");
        }

        // Load initial Recent section
        if (recentData.length > 0) {
            await initRecentSection(recentData);
            console.log("✅ Recent section loaded");
        } else {
            console.warn("⚠️ No data for recent section");
        }

        createLoadMoreButton();
        RefreshLazyLoader();
        document.getElementById("load").style.display = "none";

    } catch (error) {
        console.error("❌ Init error:", error);
        document.getElementById("load").innerHTML = `
            <div style="color: white; text-align: center; padding: 40px;">
                <h2 style="color: #eb3349;">Failed to Load</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="background: #eb3349; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}
