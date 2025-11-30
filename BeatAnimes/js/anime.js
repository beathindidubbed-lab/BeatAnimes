// Api urls
const animeapi = "/anime/";
const recommendationsapi = "/recommendations/";

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
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (errors) {
        console.error(`Fetch error (attempt ${errCount + 1}):`, errors);
        return getJson(path, errCount + 1);
    }
}

function getGenreHtml(genres) {
    if (!genres || !Array.isArray(genres)) return "";
    
    let ghtml = "";
    for (let i = 0; i < genres.length; i++) {
        const genre = String(genres[i] || "").trim();
        if (genre) {
            ghtml += `<a>${genre}</a>`;
        }
    }
    return ghtml;
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

function getAnilistTitle(title) {
    if (!title) return "Unknown";
    
    if (title.userPreferred) return title.userPreferred;
    if (title.english) return title.english;
    if (title.romaji) return title.romaji;
    if (title.native) return title.native;
    
    return "Unknown";
}

function getAnilistOtherTitle(title, current) {
    if (!title) return "Unknown";
    
    if (title.userPreferred && title.userPreferred !== current) return title.userPreferred;
    if (title.english && title.english !== current) return title.english;
    if (title.romaji && title.romaji !== current) return title.romaji;
    if (title.native && title.native !== current) return title.native;
    
    return "Unknown";
}

// Function to get anime info from Telegram API
async function loadAnimeFromTelegram(data) {
    console.log("📺 Loading Telegram data:", data);
    
    if (!data) {
        throw new Error("No anime data received from Telegram API");
    }

    const name = data.name || "Unknown Anime";
    const image = data.image || "./static/loading1.gif";
    
    // Handle episodes array
    let episodes = [];
    if (data.episodes && Array.isArray(data.episodes)) {
        episodes = data.episodes;
        console.log(`✅ Found ${episodes.length} episodes`);
    }
    
    const plot_summary = data.plot_summary || data.description || "No description available.";
    const other_name = data.other_name || data.otherNames || "N/A";
    const released = data.released || data.releaseYear || "Unknown";
    const status = data.status || "Available";
    const type = data.type || "TV";
    const totalEpisodes = data.totalEpisodes || episodes.length;
    
    let genre = "Unknown";
    if (data.genre) {
        if (typeof data.genre === 'string') {
            genre = data.genre;
        } else if (Array.isArray(data.genre)) {
            genre = data.genre.join(", ");
        }
    }

    // Replace placeholders
    document.documentElement.innerHTML = document.documentElement.innerHTML
        .replaceAll("TITLE", name)
        .replaceAll("IMG", image)
        .replaceAll("LANG", "TELEGRAM")
        .replaceAll("TYPE", type)
        .replaceAll("URL", window.location.href)
        .replaceAll("SYNOPSIS", plot_summary)
        .replaceAll("OTHER", other_name)
        .replaceAll("TOTAL", totalEpisodes)
        .replaceAll("YEAR", released)
        .replaceAll("STATUS", status)
        .replaceAll("GENERES", getGenreHtml(genre.split(",")));

    document.getElementById("main-content").style.display = "block";
    document.getElementById("load").style.display = "none";
    
    setTimeout(() => {
        const posterImg = document.getElementById("poster-img");
        if (posterImg) posterImg.style.display = "block";
    }, 100);

    if (episodes.length === 0) {
        console.warn("⚠️ No episodes available");
        const ephtml = '<a id="no-ep-found" class="ep-btn" style="cursor: default;">No Episodes Found</a>';
        document.getElementById("ep-lower-div").innerHTML = ephtml;
        document.getElementById("ep-divo-outer").style.display = "block";
        document.getElementById("ep-upper-div").style.display = "none";
        document.getElementById('ep-lower-div').style.gridTemplateColumns = "unset";
        
        const watchBtn = document.getElementById("watch-btn");
        if (watchBtn) {
            watchBtn.style.opacity = "0.5";
            watchBtn.style.cursor = "not-allowed";
            watchBtn.onclick = (e) => {
                e.preventDefault();
                alert("No episodes available yet.");
            };
        }
    } else {
        const watchBtn = document.getElementById("watch-btn");
        if (watchBtn && episodes[0] && episodes[0][1]) {
            watchBtn.href = "./episode.html?anime_id=" + encodeURIComponent(AnimeID) + "&episode_id=" + episodes[0][1];
        }

        console.log("✅ Telegram Anime Info loaded");
        RefreshLazyLoader();

        getEpSlider(episodes);
        getEpList(episodes);
    }
    
    // Try to get recommendations
    if (name) {
        getRecommendations(name);
    }
}

// Function to get anime info from gogo id
async function loadAnimeFromGogo(data) {
    console.log("📺 Loading GogoAnime data:", data);
    
    if (!data) {
        throw new Error("No anime data received from API");
    }

    const name = data.name || "Unknown Anime";
    const image = data.image || "./static/loading1.gif";
    
    // CRITICAL FIX: Handle episodes array correctly
    let episodes = [];
    if (data.episodes && Array.isArray(data.episodes)) {
        episodes = data.episodes;
        console.log(`✅ Found ${episodes.length} episodes`);
    } else {
        console.warn("⚠️ No episodes array found in response");
    }
    
    const plot_summary = data.plot_summary || data.synopsis || data.description || "No description available.";
    const other_name = data.other_name || data.otherNames || "N/A";
    const released = data.released || data.releaseYear || data.release || "Unknown";
    const status = data.status || "Unknown";
    const type = data.type || "TV";
    
    let genre = "Unknown";
    if (data.genre) {
        if (typeof data.genre === 'string') {
            genre = data.genre;
        } else if (Array.isArray(data.genre)) {
            genre = data.genre.join(", ");
        }
    }

    // Replace placeholders
    document.documentElement.innerHTML = document.documentElement.innerHTML
        .replaceAll("TITLE", name)
        .replaceAll("IMG", image)
        .replaceAll("LANG", "EP " + episodes.length)
        .replaceAll("TYPE", type)
        .replaceAll("URL", window.location.href)
        .replaceAll("SYNOPSIS", plot_summary)
        .replaceAll("OTHER", other_name)
        .replaceAll("TOTAL", episodes.length)
        .replaceAll("YEAR", released)
        .replaceAll("STATUS", status)
        .replaceAll("GENERES", getGenreHtml(genre.split(",")));

    document.getElementById("main-content").style.display = "block";
    document.getElementById("load").style.display = "none";
    
    setTimeout(() => {
        const posterImg = document.getElementById("poster-img");
        if (posterImg) posterImg.style.display = "block";
    }, 100);

    if (episodes.length === 0) {
        console.warn("⚠️ No episodes available for this anime");
        const ephtml = '<a id="no-ep-found" class="ep-btn" style="cursor: default;">No Episodes Found - Anime may not be available yet</a>';
        document.getElementById("ep-lower-div").innerHTML = ephtml;
        document.getElementById("ep-divo-outer").style.display = "block";
        document.getElementById("ep-upper-div").style.display = "none";
        document.getElementById('ep-lower-div').style.gridTemplateColumns = "unset";
        
        // Hide watch button if no episodes
        const watchBtn = document.getElementById("watch-btn");
        if (watchBtn) {
            watchBtn.style.opacity = "0.5";
            watchBtn.style.cursor = "not-allowed";
            watchBtn.onclick = (e) => {
                e.preventDefault();
                alert("No episodes available yet for this anime.");
            };
        }
    } else {
        const watchBtn = document.getElementById("watch-btn");
        if (watchBtn && episodes[0] && episodes[0][1]) {
            watchBtn.href = "./episode.html?anime_id=" + AnimeID + "&episode_id=" + episodes[0][1];
        }

        console.log("✅ Anime Info loaded");
        RefreshLazyLoader();

        getEpSlider(episodes);
        getEpList(episodes);
    }
    
    getRecommendations(name);
}

// Rest of the functions remain the same...
// (getAnilistTitle, getAnilistOtherTitle, loadAnimeFromAnilist, getEpSlider, retryImageLoad, getEpList, getEpLowerList, episodeSelectChange, getRecommendations, plusSlides)

// At the end, modify loadData function:

async function loadData() {
    try {
        console.log(`🔍 Loading anime: ${AnimeID}`);
        
        let data = await getJson(animeapi + encodeURIComponent(AnimeID));
        
        console.log("📦 API Response:", data);
        
        if (!data || !data.results) {
            throw new Error("Invalid response from API");
        }
        
        data = data.results;

        // Handle Telegram source (from your custom API)
        if (data.source === "telegram") {
            console.log("✅ Using Telegram source");
            await loadAnimeFromTelegram(data);
        } else if (data.source === "gogoanime") {
            await loadAnimeFromGogo(data);
        } else if (data.source === "anilist") {
            await loadAnimeFromAnilist(data);
        } else {
            console.warn("Unknown source, attempting GogoAnime format:", data.source);
            await loadAnimeFromGogo(data);
        }
        
        RefreshLazyLoader();
    } catch (err) {
        console.error("❌ Error loading anime:", err);
        document.getElementById("error-page").style.display = "block";
        document.getElementById("load").style.display = "none";
        document.getElementById("main-content").style.display = "none";
        document.getElementById("error-desc").innerHTML = err.message || "Unknown error occurred";
    }
}

// Make functions global
window.plusSlides = plusSlides;
window.episodeSelectChange = episodeSelectChange;
window.retryImageLoad = retryImageLoad;

loadData();
