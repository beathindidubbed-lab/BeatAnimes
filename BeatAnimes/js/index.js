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
        throw new Error(`Failed to fetch: ${path}`);
    }

    try {
        const response = await fetch(url, { 
            headers: { referer: window.location.origin },
            cache: 'no-cache'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (errors) {
        console.error(`Fetch error (attempt ${errCount + 1}):`, errors);
        await new Promise(r => setTimeout(r, 1000 * (errCount + 1)));
        return getJson(path, errCount + 1);
    }
}


async function searchAnilistForBanner(animeName) {
    const query = `
        query ($search: String) {
            Media(search: $search, type: ANIME) {
                bannerImage
                coverImage { 
                    extraLarge 
                    large 
                }
            }
        }
    `;

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: { search: animeName }
            })
        });

        const data = await response.json();
        
        if (data.data && data.data.Media) {
            return {
                bannerImage: data.data.Media.bannerImage,
                coverImage: data.data.Media.coverImage?.extraLarge || data.data.Media.coverImage?.large
            };
        }
        
        return null;
    } catch (error) {
        console.error(`Anilist banner fetch error:`, error.message);
        return null;
    }
}


async function getTrendingAnimes(popularData) {
    if (!popularData || popularData.length === 0) {
        console.warn("⚠️ No data for banner");
        return;
    }

    console.log(`📺 Loading banner with ${popularData.length} anime...`);

    let SLIDER_HTML = "";
    
    // ✅ Fetch Anilist data for each anime to get banner images
    for (let pos = 0; pos < Math.min(popularData.length, 10); pos++) {
        let anime = popularData[pos];
        if (!anime) continue;
        
        let title = anime.title || anime.name || "Unknown";
        let id = anime.id || "";
        let type = anime.type || "TV";
        let status = anime.release || anime.released || "Available";
        let url = "./anime.html?anime_id=" + encodeURIComponent(id);
        
        // ✅ Default to thumbnail if no banner
        let poster = anime.image || anime.poster || "./static/loading1.gif";
        
        // ✅ Try to get banner image from Anilist
        try {
            const anilistData = await searchAnilistForBanner(title);
            if (anilistData && anilistData.bannerImage) {
                poster = anilistData.bannerImage;
                console.log(`✅ Got banner for ${title}:`, poster);
            } else if (anilistData && anilistData.coverImage) {
                poster = anilistData.coverImage;
            }
        } catch (err) {
            console.warn(`⚠️ Could not get banner for ${title}, using default`);
        }

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
    
    console.log("✅ Banner loaded successfully");
}

// Recent section - initial load
async function initRecentSection(recentData) {
    if (!recentData || recentData.length === 0) {
        console.warn("⚠️ No recent data");
        return;
    }

    console.log(`⏰ Loading recent section with ${recentData.length} anime...`);

    let RECENT_HTML = "";

    for (let anime of recentData) {
        if (!anime) continue;
        
        let title = anime.title || anime.name || "Unknown";
        let id = (anime.id || "").split("-episode-")[0];
        if (!id) id = anime.animeId || "";
        
        let url = "./anime.html?anime_id=" + encodeURIComponent(id);
        let image = anime.image || anime.poster || "./static/loading1.gif";
        let ep = String(anime.episode || anime.episodeNumber || "").match(/\d+/)?.[0] || "?";
        let subOrDub = (title.toLowerCase().includes("dub") || anime.isDub) ? "DUB" : "SUB";

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
    console.log("✅ Recent section loaded");
}

// Load more recent anime
let recentPage = 2;
let isLoadingRecent = false;
let hasMoreRecent = true;

async function getRecentAnimes(page = 2) {
    if (isLoadingRecent) return false;
    
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
            
            let title = anime.title || anime.name || "Unknown";
            let id = (anime.id || "").split("-episode-")[0];
            if (!id) id = anime.animeId || "";
            
            let url = "./anime.html?anime_id=" + encodeURIComponent(id);
            let image = anime.image || anime.poster || "./static/loading1.gif";
            let ep = String(anime.episode || anime.episodeNumber || "").match(/\d+/)?.[0] || "?";
            let subOrDub = (title.toLowerCase().includes("dub") || anime.isDub) ? "DUB" : "SUB";

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

// MAIN INITIALIZATION
async function initializePage() {
    try {
        console.log("🚀 Starting BeatAnimes...");
        document.getElementById("load").style.display = "block";

        // Fetch home data
        console.log("📡 Fetching /home API...");
        const homeResponse = await getJson(IndexApi);
        console.log("📦 Home API Response:", homeResponse);
        
        // Extract data - handle multiple structures
        let homeData = homeResponse.results || homeResponse;
        
        // Extract popular anime (for banner and popular section)
        let popularData = [];
        if (homeData.popular) {
            if (Array.isArray(homeData.popular)) {
                popularData = homeData.popular;
            } else if (homeData.popular.results) {
                popularData = homeData.popular.results;
            }
        } else if (homeData.gogoPopular) {
            popularData = homeData.gogoPopular;
        } else if (homeData.trending) {
            popularData = homeData.trending;
        }
        
        // Extract recent anime
        let recentData = [];
        if (homeData.recent) {
            if (Array.isArray(homeData.recent)) {
                recentData = homeData.recent;
            } else if (homeData.recent.results) {
                recentData = homeData.recent.results;
            }
        } else if (homeData.gogoRecent) {
            recentData = homeData.gogoRecent;
        }
        
        console.log(`📊 Extracted: ${popularData.length} popular, ${recentData.length} recent`);

        // Load all sections
        if (popularData.length > 0) {
            await getTrendingAnimes(popularData);
            await getPopularAnimes(popularData);
            
            // Start slider
            slideIndex = 1;
            showSlides(slideIndex);
            showSlides2();
        } else {
            console.error("❌ No popular data - banner and popular sections will be empty");
        }

        if (recentData.length > 0) {
            await initRecentSection(recentData);
        } else {
            console.warn("⚠️ No recent data from /home, will try /recent/1");
            await getRecentAnimes(1);
        }

        createLoadMoreButton();
        RefreshLazyLoader();
        
        document.getElementById("load").style.display = "none";
        console.log("✅ Page loaded successfully!");

    } catch (error) {
        console.error("❌ Fatal error:", error);
        document.getElementById("load").innerHTML = `
            <div style="color: white; text-align: center; padding: 40px;">
                <h2 style="color: #eb3349;">⚠️ Failed to Load</h2>
                <p style="margin: 20px 0;">${error.message}</p>
                <p style="font-size: 14px; opacity: 0.7;">Check console for details (F12)</p>
                <button onclick="location.reload()" style="background: #eb3349; color: white; padding: 12px 30px; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; margin-top: 20px;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

// Make functions global
window.plusSlides = plusSlides;
window.showSlides = showSlides;

// Start when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

