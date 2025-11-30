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

// Function to get anime info from anilist search
async function loadAnimeFromAnilist(data) {
    console.log("📺 Loading Anilist data (no episodes available):", data);
    
    if (!data) {
        throw new Error("No anime data received from Anilist");
    }

    const title = getAnilistTitle(data.title);
    const coverImage = data.coverImage?.large || data.coverImage?.medium || "./static/loading1.gif";
    const episodes = data.episodes || "?";
    const format = data.format || "TV";
    const description = data.description 
        ? data.description.replace(/<[^>]*>/g, '') 
        : "No description available.";
    const otherTitle = getAnilistOtherTitle(data.title, title);
    const seasonYear = data.seasonYear || "Unknown";
    const status = data.status || "Unknown";
    const genres = data.genres || [];

    document.documentElement.innerHTML = document.documentElement.innerHTML
        .replaceAll("TITLE", title)
        .replaceAll("IMG", coverImage)
        .replaceAll("LANG", "EP " + episodes)
        .replaceAll("TYPE", format)
        .replaceAll("URL", window.location.href)
        .replaceAll("SYNOPSIS", description)
        .replaceAll("OTHER", otherTitle)
        .replaceAll("TOTAL", "EP " + episodes)
        .replaceAll("YEAR", seasonYear)
        .replaceAll("STATUS", status)
        .replaceAll("GENERES", getGenreHtml(genres));

    document.getElementById("main-content").style.display = "block";
    document.getElementById("load").style.display = "none";

    console.log("✅ Anime Info loaded from Anilist");

    const recommendations = data.recommendations || [];
    let rechtml = "";

    for (let i = 0; i < Math.min(recommendations.length, 20); i++) {
        let anime = recommendations[i];
        if (!anime || !anime.title) continue;
        
        let animeTitle = anime.title.userPreferred || anime.title.english || "Unknown";
        let coverImg = anime.coverImage?.large || "./static/loading1.gif";
        let meanScore = anime.meanScore || "N/A";
        let animeFormat = anime.format || "TV";
        let animeEpisodes = anime.episodes || "?";
        let animeStatus = anime.status || "Unknown";
        
        rechtml += `<a href="./anime.html?anime_id=${encodeURIComponent(animeTitle)}">
            <div class="poster la-anime">
                <div id="shadow1" class="shadow">
                    <div class="dubb">${meanScore} / 100</div>
                    <div class="dubb dubb2">${animeFormat}</div>
                </div>
                <div id="shadow2" class="shadow">
                    <img class="lzy_img" src="./static/loading1.gif" data-src="${coverImg}" 
                         onerror="this.src='./static/loading1.gif'" alt="${animeTitle}">
                </div>
                <div class="la-details">
                    <h3>${animeTitle}</h3>
                    <div id="extra">
                        <span>${animeStatus}</span>
                        <span class="dot"></span>
                        <span>EP ${animeEpisodes}</span>
                    </div>
                </div>
            </div>
        </a>`;
    }
    
    document.getElementById("latest2").innerHTML = rechtml;
    document.getElementById("ep-lower-div").innerHTML = 
        '<a class="ep-btn" style="cursor: default;">This anime is not available on GogoAnime yet. Try searching with the Japanese title or wait for it to be released.</a>';

    RefreshLazyLoader();
    console.log("✅ Anime Recommendations loaded");
}

// Function to get episode Slider
async function getEpSlider(total) {
    if (!total || !Array.isArray(total) || total.length === 0) {
        console.warn("No episodes to display in slider");
        return;
    }

    let ephtml = "";

    try {
        for (let i = 0; i < total.length; i++) {
            if (!total[i] || total[i].length < 2) continue;
            
            const episodeId = total[i][1];
            const epNum = String(total[i][0] || "").replaceAll("-", ".");
            
            if (Number(epNum) > 0) {
                ephtml += `<div class="ep-slide">
                    <a href="./episode.html?anime_id=${AnimeID}&episode_id=${episodeId}">
                        <img onerror="retryImageLoad(this)" class="lzy_img" 
                             src="./static/loading1.gif" 
                             data-src="https://thumb.techzbots1.workers.dev/thumb/${episodeId}"
                             alt="Episode ${epNum}">
                        <div class="ep-title">
                            <span>Episode ${epNum}</span>
                        </div>
                    </a>
                </div>`;
            }
        }
        
        document.getElementById("ep-slider").innerHTML = ephtml;
        document.getElementById("slider-main").style.display = "block";
        RefreshLazyLoader();
        console.log("✅ Episode Slider loaded");
    } catch (err) {
        console.error("Episode slider error:", err);
    }
}

// Retry image load
function retryImageLoad(img) {
    const ImageUrl = img.src;
    img.src = "./static/loading1.gif";

    setTimeout(() => {
        if (ImageUrl.includes("?t=")) {
            const t = Number(ImageUrl.split("?t=")[1]) + 1;
            if (t < 5) {
                img.src = ImageUrl.split("?t=")[0] + "?t=" + String(t);
            }
        } else {
            img.src = ImageUrl + "?t=1";
        }
    }, 3000);
}

// Function to get episode list
let Episode_List = [];

async function getEpList(total) {
    if (!total || !Array.isArray(total)) {
        console.warn("No episodes to list");
        return;
    }

    Episode_List = total;
    const TotalEp = total.length;
    let html = "";
    let loadedFirst = false;

    for (let i = 0; i < total.length; i++) {
        if (!total[i] || total[i].length < 1) continue;
        
        const epnum = Number(String(total[i][0] || "0").replaceAll("-", "."));

        if ((epnum - 1) % 100 === 0) {
            let epUpperBtnText;

            if (TotalEp - epnum < 100) {
                epUpperBtnText = `${epnum} - ${TotalEp}`;
                html += `<option class="ep-btn" data-from="${epnum}" data-to="${TotalEp}">${epUpperBtnText}</option>`;

                if (!loadedFirst) {
                    getEpLowerList(epnum, TotalEp);
                    loadedFirst = true;
                }
            } else {
                epUpperBtnText = `${epnum} - ${epnum + 99}`;
                html += `<option class="ep-btn" data-from="${epnum}" data-to="${epnum + 99}">${epUpperBtnText}</option>`;

                if (!loadedFirst) {
                    getEpLowerList(epnum, epnum + 99);
                    loadedFirst = true;
                }
            }
        }
    }
    
    document.getElementById("ep-upper-div").innerHTML = html;
    document.getElementById("ep-divo-outer").style.display = "block";
    console.log("✅ Episode list loaded");
}

async function getEpLowerList(start, end) {
    let html = "";
    const eplist = Episode_List.slice(start - 1, end);

    for (let i = 0; i < eplist.length; i++) {
        if (!eplist[i] || eplist[i].length < 2) continue;
        
        const episode_id = eplist[i][1];
        const x = episode_id.split("-episode-");
        let epnum = Number(String(x[1] || "0").replaceAll("-", "."));

        let epLowerBtnText = `${epnum}`;

        html += `<a class="ep-btn" href="./episode.html?anime_id=${AnimeID}&episode_id=${episode_id}">${epLowerBtnText}</a>`;
    }
    
    document.getElementById("ep-lower-div").innerHTML = html;
}

async function episodeSelectChange(elem) {
    const option = elem.options[elem.selectedIndex];
    getEpLowerList(
        parseInt(option.getAttribute("data-from")),
        parseInt(option.getAttribute("data-to"))
    );
}

// Function to get anime recommendations
async function getRecommendations(anime_title) {
    const loadElem = document.getElementsByClassName("sload")[0];
    if (loadElem) loadElem.style.display = "block";

    anime_title = anime_title.replaceAll(" ", "+");

    let data;
    try {
        data = await getJson(recommendationsapi + anime_title);
    } catch (err) {
        console.error("Failed to load recommendations:", err);
        const similarDiv = document.getElementById("similar-div");
        if (similarDiv) similarDiv.style.display = "none";
        return;
    }

    if (!data || !data.results || !Array.isArray(data.results)) {
        console.warn("No recommendations available");
        if (loadElem) loadElem.style.display = "none";
        return;
    }

    const recommendations = data.results;
    let rechtml = "";

    for (let i = 0; i < Math.min(recommendations.length, 20); i++) {
        let anime = recommendations[i];
        if (!anime || !anime.title) continue;
        
        let title = anime.title.userPreferred || anime.title.english || "Unknown";
        let coverImg = anime.coverImage?.large || "./static/loading1.gif";
        let meanScore = anime.meanScore || "N/A";
        let format = anime.format || "TV";
        let episodes = anime.episodes || "?";
        let status = anime.status || "Unknown";
        
        rechtml += `<a href="./anime.html?anime_id=${encodeURIComponent(title)}">
            <div class="poster la-anime">
                <div id="shadow1" class="shadow">
                    <div class="dubb">${meanScore} / 100</div>
                    <div class="dubb dubb2">${format}</div>
                </div>
                <div id="shadow2" class="shadow">
                    <img class="lzy_img" src="./static/loading1.gif" data-src="${coverImg}" 
                         onerror="this.src='./static/loading1.gif'" alt="${title}">
                </div>
                <div class="la-details">
                    <h3>${title}</h3>
                    <div id="extra">
                        <span>${status}</span>
                        <span class="dot"></span>
                        <span>EP ${episodes}</span>
                    </div>
                </div>
            </div>
        </a>`;
    }
    
    document.getElementById("latest2").innerHTML = rechtml;
    if (loadElem) loadElem.style.display = "none";
    console.log("✅ Anime Recommendations loaded");
    RefreshLazyLoader();
}

// Function to scroll episode slider
const windowWidth = window.innerWidth;

function plusSlides(n) {
    const carousel = document.getElementById("slider-carousel");
    if (!carousel) return;
    
    if (n === 1) {
        carousel.scrollLeft += windowWidth / 2;
    } else if (n === -1) {
        carousel.scrollLeft -= windowWidth / 2;
    }
}

// Running functions
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const AnimeID = urlParams.get("anime_id");
if (!AnimeID) {
    window.location = "./index.html";
}

async function loadData() {
    try {
        console.log(`🔍 Loading anime: ${AnimeID}`);
        
        let data = await getJson(animeapi + encodeURIComponent(AnimeID));
        
        console.log("📦 API Response:", data);
        
        if (!data || !data.results) {
            throw new Error("Invalid response from API");
        }
        
        data = data.results;

        if (data.source === "gogoanime") {
            await loadAnimeFromGogo(data);
        } else if (data.source === "anilist") {
            await loadAnimeFromAnilist(data);
        } else {
            throw new Error("Unknown data source");
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
