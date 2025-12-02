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
        throw new Error(`Failed after 3 attempts: ${path}`);
    }

    try {
        console.log(`🔄 Fetching: ${url} (attempt ${errCount + 1})`);
        const response = await fetch(url, { 
            headers: { referer: window.location.origin },
            cache: 'no-cache',
            signal: AbortSignal.timeout(15000)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Success: ${path}`);
        return data;
    } catch (error) {
        console.error(`❌ Attempt ${errCount + 1} failed:`, error.message);
        
        if (errCount < 2) {
            await new Promise(r => setTimeout(r, 1000 * (errCount + 1)));
            return getJson(path, errCount + 1);
        }
        throw error;
    }
}

// Banner section
async function getTrendingAnimes(popularData) {
    if (!popularData || popularData.length === 0) {
        console.warn("⚠️ No banner data");
        return;
    }

    console.log(`📺 Loading banner with ${popularData.length} anime...`);

    let SLIDER_HTML = "";
    
    for (let pos = 0; pos < Math.min(popularData.length, 10); pos++) {
        let anime = popularData[pos];
        if (!anime || !anime.title) continue;
        
        let title = anime.title || anime.name || "Unknown";
        let id = anime.id || "";
        let type = anime.type || "TV";
        let status = "Available";
        let url = "./anime.html?anime_id=" + encodeURIComponent(id);
        let poster = anime.image || "./static/loading1.gif";

        const imageUrl = poster.startsWith('http') ? poster : './static/loading1.gif';

        SLIDER_HTML += `<div class="mySlides fade">
            <div class="data-slider">
                <p class="spotlight">#${pos + 1} Spotlight</p>
                <h1>${title}</h1>
                <div class="extra1">
                    <span class="year"><i class="fa fa-play-circle"></i>${type}</span>
                    <span class="year year2"><i class="fa fa-calendar"></i>${status}</span>
                    <span class="cbox cbox1">HD</span>
                    <span class="cbox cbox2">${anime.source || 'ANIME'}</span>
                </div>
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
            <img src="${imageUrl}" onerror="this.src='./static/loading1.gif'" alt="${title}">
        </div>`;
    }

    const container = document.querySelector(".slideshow-container");
    if (container) {
        container.innerHTML = SLIDER_HTML + 
            '<a class="prev" onclick="plusSlides(-1)">&#10094;</a>' +
            '<a class="next" onclick="plusSlides(1)">&#10095;</a>';
    }
    
    console.log("✅ Banner loaded");
}

// ✅ ADDED: Popular section function
async function getPopularAnimes(popularData) {
    if (!popularData || popularData.length === 0) {
        console.warn("⚠️ No popular anime");
        document.querySelector(".popularg").innerHTML = 
            '<p style="color: white; padding: 20px; text-align: center;">No popular anime available</p>';
        return;
    }

    console.log(`🔥 Loading ${popularData.length} popular anime...`);

    let POPULAR_HTML = "";

    for (let pos = 0; pos < Math.min(popularData.length, 24); pos++) {
        let anime = popularData[pos];
        if (!anime || !anime.title) continue;
        
        let title = anime.title || anime.name || "Unknown";
        let id = anime.id || "";
        let url = "./anime.html?anime_id=" + encodeURIComponent(id);
        let image = anime.image || "./static/loading1.gif";
        let tag = anime.source ? anime.source.toUpperCase() : "ANIME";

        POPULAR_HTML += `<a href="${url}">
            <div class="poster la-anime">
                <div id="shadow1" class="shadow">
                    <div class="dubb"># ${pos + 1}</div>
                    <div class="dubb dubb2">${tag}</div>
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
    console.log("✅ Popular section loaded");
}

// Recent section
async function initRecentSection(recentData) {
    if (!recentData || recentData.length === 0) {
        console.warn("⚠️ No recent data");
        document.querySelector(".recento").innerHTML = 
            '<p style="color: white; padding: 20px; text-align: center;">No recent releases available</p>';
        return;
    }

    console.log(`⏰ Loading ${recentData.length} recent anime...`);

    let RECENT_HTML = "";

    for (let anime of recentData.slice(0, 24)) {
        if (!anime || !anime.title) continue;
        
        let title = anime.title || anime.name || "Unknown";
        let id = anime.id || "";
        let url = "./anime.html?anime_id=" + encodeURIComponent(id);
        let image = anime.image || "./static/loading1.gif";
        let ep = anime.episode || anime.episodeNumber || "";
        let tag = anime.source ? anime.source.toUpperCase() : "NEW";

        RECENT_HTML += `<a href="${url}">
            <div class="poster la-anime">
                <div id="shadow1" class="shadow">
                    <div class="dubb">${tag}</div>
                    ${ep ? `<div class="dubb dubb2">${ep}</div>` : ''}
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

    document.querySelector(".recento").innerHTML = RECENT_HTML;
    console.log("✅ Recent section loaded");
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

// MAIN INITIALIZATION
async function initializePage() {
    const loader = document.getElementById("load");
    
    try {
        console.log("🚀 Starting BeatAnimes...");
        if (loader) loader.style.display = "block";

        console.log("📡 Fetching /home...");
        const homeResponse = await getJson(IndexApi);
        console.log("📦 Home response:", homeResponse);
        
        let homeData = homeResponse.results || homeResponse;
        
        let popularData = homeData.popular || homeData.trending || [];
        let recentData = homeData.recent || [];
        
        console.log(`📊 Data: ${popularData.length} popular, ${recentData.length} recent`);

        if (popularData.length === 0 && recentData.length === 0) {
            throw new Error("No data received from API");
        }

        if (popularData.length > 0) {
            await getTrendingAnimes(popularData);
            await getPopularAnimes(popularData); // ✅ NOW THIS FUNCTION EXISTS
            
            slideIndex = 1;
            showSlides(slideIndex);
            showSlides2();
        }

        if (recentData.length > 0) {
            await initRecentSection(recentData);
        }

        RefreshLazyLoader();
        
        if (loader) loader.style.display = "none";
        console.log("✅ Page loaded successfully!");

    } catch (error) {
        console.error("❌ Fatal error:", error);
        
        if (loader) {
            loader.innerHTML = `
                <div style="color: white; text-align: center; padding: 40px;">
                    <h2 style="color: #eb3349;">Failed to Load</h2>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" style="background: #eb3349; color: white; padding: 12px 30px; border: none; border-radius: 25px; cursor: pointer; margin-top: 20px;">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

window.plusSlides = plusSlides;
window.showSlides = showSlides;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}
