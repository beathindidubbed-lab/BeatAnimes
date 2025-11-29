// Api urls
const IndexApi = "/home";
const recentapi = "/recent/";

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
        console.error(`Failed to fetch ${url} after 3 attempts`);
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
        
        const data = await response.json();
        return data;
    } catch (errors) {
        console.error("Fetch error:", errors);
        await sleep(1000 * (errCount + 1)); // Exponential backoff
        return getJson(path, errCount + 1);
    }
}

function genresToString(genres) {
    if (!genres || !Array.isArray(genres)) return "Unknown";
    return genres.slice(0, 3).join(", ");
}

function shuffle(array) {
    if (!array || !Array.isArray(array)) return [];
    let currentIndex = array.length, randomIndex;
    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }
    return array;
}

// Adding slider animes (trending animes from anilist)
async function getTrendingAnimes(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn("No trending anime data available");
        return;
    }

    let SLIDER_HTML = "";

    for (let pos = 0; pos < Math.min(data.length, 10); pos++) {
        let anime = data[pos];
        if (!anime || !anime.title) continue;
        
        let title = anime.title?.userPreferred || anime.title?.english || anime.title?.romaji || "Unknown Anime";
        let type = anime.format || "TV";
        let status = anime.status || "Unknown";
        let genres = genresToString(anime.genres);
        let description = anime.description 
            ? anime.description.replace(/<[^>]*>/g, '').substring(0, 200) + "..." 
            : "No description available";
        let url = "./anime.html?anime_id=" + encodeURIComponent(title);

        let poster = anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large || "./static/loading1.gif";

        SLIDER_HTML += `<div class="mySlides fade">
            <div class="data-slider">
                <p class="spotlight">#${pos + 1} Spotlight</p>
                <h1>${title}</h1>
                <div class="extra1">
                    <span class="year"><i class="fa fa-play-circle"></i>${type}</span>
                    <span class="year year2"><i class="fa fa-calendar"></i>${status}</span>
                    <span class="cbox cbox1">${genres}</span>
                    <span class="cbox cbox2">HD</span>
                </div>
                <p class="small-synop">${description}</p>
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

// Adding popular animes (popular animes from gogoanime)
async function getPopularAnimes(data) {
    if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
        console.warn("No popular anime data available");
        return;
    }

    let POPULAR_HTML = "";

    for (let pos = 0; pos < Math.min(data.results.length, 20); pos++) {
        let anime = data.results[pos];
        if (!anime) continue;
        
        let title = anime.title || "Unknown Anime";
        let id = anime.id || "";
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

    const container = document.querySelector(".popularg");
    if (container) {
        container.innerHTML = POPULAR_HTML;
    }
}

// Adding recent animes
async function getRecentAnimes(page = 1) {
    try {
        const data = await getJson(recentapi + page);
        
        if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
            console.warn(`No recent anime data for page ${page}`);
            return;
        }

        let RECENT_HTML = "";

        for (let pos = 0; pos < data.results.length; pos++) {
            let anime = data.results[pos];
            if (!anime) continue;
            
            let title = anime.title || "Unknown Anime";
            let id = (anime.id || "").split("-episode-")[0];
            let url = "./anime.html?anime_id=" + encodeURIComponent(id);
            let image = anime.image || "./static/loading1.gif";
            let ep = "?";
            
            if (anime.episode) {
                const epMatch = anime.episode.match(/\d+/);
                ep = epMatch ? epMatch[0] : "?";
            }
            
            let subOrDub = title.toLowerCase().includes("dub") ? "DUB" : "SUB";

            RECENT_HTML += `<a href="${url}">
                <div class="poster la-anime">
                    <div id="shadow1" class="shadow">
                        <div class="dubb">${subOrDub}</div>
                        <div class="dubb dubb2">EP ${ep}</div>
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

        const container = document.querySelector(".recento");
        if (container) {
            container.innerHTML += RECENT_HTML;
        }
        
        RefreshLazyLoader();
    } catch (error) {
        console.error("Failed to load recent animes:", error);
    }
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
        await sleep(10000);
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

function currentSlide(n) {
    showSlides((slideIndex = n));
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
    }, {
        rootMargin: "50px"
    });
    
    const arr = document.querySelectorAll("img.lzy_img");
    arr.forEach((v) => {
        imageObserver.observe(v);
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// To load more animes when scrolled to bottom
let page = 2;
let isLoading = false;

async function loadAnimes() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        await getRecentAnimes(page);
        page += 1;
    } catch (error) {
        console.error(`Failed to load page ${page}:`, error);
        page += 1; // Skip this page
    } finally {
        isLoading = false;
    }
}

// Add a scroll event listener
window.addEventListener("scroll", function () {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollPosition + 3 * windowHeight >= documentHeight) {
        loadAnimes();
    }
});

// Initialize the page
async function initializePage() {
    try {
        const loadElement = document.getElementById("load");
        if (loadElement) loadElement.style.display = "block";

        console.log("Fetching home data...");
        const data = await getJson(IndexApi);
        console.log("Home data received:", data);

        // Handle trending/slider data
        let trendingData = null;
        if (data.trending?.media) {
            trendingData = data.trending.media;
        } else if (data.trending && Array.isArray(data.trending)) {
            trendingData = data.trending;
        }

        if (trendingData && trendingData.length > 0) {
            const shuffledTrending = shuffle([...trendingData]);
            await getTrendingAnimes(shuffledTrending);
            RefreshLazyLoader();
            slideIndex = 1;
            showSlides(slideIndex);
            showSlides2();
            console.log("Trending animes loaded");
        } else {
            console.warn("No trending data available");
        }

        // Handle popular data
        if (data.popular) {
            const shuffledPopular = { 
                results: shuffle([...(data.popular.results || data.popular)]) 
            };
            await getPopularAnimes(shuffledPopular);
            RefreshLazyLoader();
            console.log("Popular animes loaded");
        }

        // Handle recent data
        await getRecentAnimes(1);
        console.log("Recent animes loaded");

        if (loadElement) loadElement.style.display = "none";

    } catch (error) {
        console.error("Failed to initialize homepage:", error);
        const loadElement = document.getElementById("load");
        if (loadElement) {
            loadElement.innerHTML = `
                <div style="color: white; text-align: center; padding: 40px;">
                    <h2 style="color: #eb3349; margin-bottom: 20px;">Failed to Load Content</h2>
                    <p style="margin-bottom: 20px;">${error.message}</p>
                    <button onclick="location.reload()" 
                            style="background: #eb3349; color: white; padding: 10px 20px; 
                                   border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}
