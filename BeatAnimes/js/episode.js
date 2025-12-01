// Api urls
const animeapi = "/anime/";
const episodeapi = "/episode/";
const dlapi = "/download/";

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
        console.error(errors);
        return getJson(path, errCount + 1);
    }
}

// Load video player with Telegram support
async function loadVideo(name, episodeData) {
    try {
        const epNameEl = document.getElementById("ep-name");
        if (epNameEl) epNameEl.innerHTML = name;
        
        const serversbtn = document.getElementById("serversbtn");
        if (!serversbtn) throw new Error("Servers button container not found");

        // Check if we have variants (Telegram API)
        if (episodeData.variants && Array.isArray(episodeData.variants) && episodeData.variants.length > 0) {
            console.log("✅ Using Telegram variants");
            
            // Group by language
            const languages = {};
            for (const variant of episodeData.variants) {
                if (!languages[variant.language]) {
                    languages[variant.language] = [];
                }
                languages[variant.language].push(variant);
            }

            let html = '<div class="language-selector">';
            Object.keys(languages).forEach((lang, index) => {
                const active = index === 0 ? 'active' : '';
                html += `<button class="lang-btn ${active}" data-lang="${lang}" onclick="switchLanguage('${lang}')">${lang}</button>`;
            });
            html += '</div>';

            Object.entries(languages).forEach(([lang, variants], langIndex) => {
                const display = langIndex === 0 ? 'block' : 'none';
                html += `<div class="quality-selector quality-${lang}" style="display: ${display}">`;
                
                variants.forEach((variant, index) => {
                    const active = index === 0 && langIndex === 0 ? 'sactive' : '';
                    const channelUrl = `https://t.me/${variant.videoUrl}`;
                    
                    html += `<div class="sitem">
                        <a class="sobtn ${active}" 
                           onclick="selectTelegramServer(this)" 
                           data-value="${channelUrl}?embed=1"
                           data-direct="${channelUrl}">
                           ${variant.quality} ${variant.language}
                        </a>
                    </div>`;
                });
                
                html += '</div>';
            });
            
            serversbtn.innerHTML = html;
            
            const firstBtn = document.querySelector('.sobtn.sactive');
            if (firstBtn) firstBtn.click();
            
            return true;

        } else if (episodeData.stream && episodeData.stream.sources) {
            // GogoAnime format (fallback)
            console.log("✅ Using GogoAnime stream");
            let url = episodeData.stream.sources[0].file;
            serversbtn.innerHTML = `<div class="sitem">
                <a class="sobtn sactive" onclick="selectServer(this)" 
                   data-value="./embed.html?url=${encodeURIComponent(url)}&episode_id=${EpisodeID}">
                   AD Free 1
                </a>
            </div>`;
            
            const activeBtn = document.getElementsByClassName("sactive")[0];
            if (activeBtn) activeBtn.click();
            return true;
            
        } else {
            throw new Error("No video sources available");
        }
    } catch (err) {
        console.error("loadVideo error:", err);
        return false;
    }
}

// Language switcher (for Telegram API)
window.switchLanguage = function(language) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === language) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('.quality-selector').forEach(selector => {
        selector.style.display = 'none';
    });
    const targetSelector = document.querySelector(`.quality-${language}`);
    if (targetSelector) {
        targetSelector.style.display = 'block';
    }
    
    const firstBtn = document.querySelector(`.quality-${language} .sobtn`);
    if (firstBtn) {
        document.querySelectorAll('.sobtn').forEach(btn => btn.classList.remove('sactive'));
        firstBtn.classList.add('sactive');
        firstBtn.click();
    }
}

// Telegram server selector
window.selectTelegramServer = function(btn) {
    if (!btn) return;
    
    const buttons = document.getElementsByClassName("sobtn");
    const iframe = document.getElementById("BeatAnimesFrame");
    
    if (!iframe) {
        console.error("Video iframe not found");
        return;
    }

    const videoUrl = btn.getAttribute("data-value");
    if (videoUrl) {
        iframe.src = videoUrl;
    }
    
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("sactive");
    }
    btn.classList.add("sactive");
}

// Function to select server (GogoAnime)
function selectServer(btn, sandbox = false) {
    if (!btn) return;
    
    const buttons = document.getElementsByClassName("sobtn");
    const iframe = document.getElementById("BeatAnimesFrame");
    
    if (!iframe) {
        console.error("Video iframe not found");
        return;
    }

    if (sandbox === true) {
        iframe.sandbox = "allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation";
    } else {
        iframe.removeAttribute("sandbox");
    }

    const videoUrl = btn.getAttribute("data-value");
    if (videoUrl) {
        iframe.src = videoUrl;
    }
    
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].className = "sobtn";
    }
    btn.className = "sobtn sactive";
}

// Function to show download links
function showDownload() {
    const showDlBtn = document.getElementById("showdl");
    const dlDiv = document.getElementById("dldiv");
    
    if (showDlBtn) showDlBtn.style.display = "none";
    if (dlDiv) dlDiv.classList.toggle("show");

    // For Telegram, show direct link
    getDownloadLinks(EpisodeID);
}

// Function to get download links
async function getDownloadLinks(episodeId) {
    const dlLinks = document.getElementById("dllinks");
    if (!dlLinks) return;

    try {
        const data = await getJson(episodeapi + episodeId);
        
        if (!data || !data.results) {
            throw new Error("No episode data");
        }

        const episodeData = data.results;

        // If Telegram variants, show direct links
        if (episodeData.variants && Array.isArray(episodeData.variants)) {
            let html = "";
            
            for (const variant of episodeData.variants) {
                const channelUrl = `https://t.me/${variant.videoUrl}`;
                html += `<div class="sitem">
                    <a class="sobtn download" target="_blank" href="${channelUrl}">
                        <i class="fa fa-download"></i>${variant.quality} ${variant.language}
                    </a>
                </div>`;
            }
            
            dlLinks.innerHTML = html;
        } else {
            dlLinks.innerHTML = '<p style="color: white; padding: 10px;">Download links not available</p>';
        }
    } catch (err) {
        console.error("Download links error:", err);
        dlLinks.innerHTML = '<p style="color: red; padding: 10px;">Failed to load download links</p>';
    }
}

// Function to get episode list
let Episode_List = [];

async function getEpUpperList(eplist) {
    if (!eplist || !Array.isArray(eplist) || eplist.length === 0) {
        console.warn("No episodes available");
        return;
    }

    const current_ep = Number(EpisodeID.split("-episode-")[1]);
    Episode_List = eplist;
    const TotalEp = eplist.length;
    let html = "";

    for (let i = 0; i < eplist.length; i++) {
        if (!eplist[i] || !eplist[i][0]) continue;
        
        const epnum = Number(String(eplist[i][0]));

        if ((epnum - 1) % 100 === 0) {
            let epUpperBtnText;
            if (TotalEp - epnum < 100) {
                epUpperBtnText = `${epnum} - ${TotalEp}`;

                if (epnum <= current_ep && current_ep <= TotalEp) {
                    html += `<option id="default-ep-option" class="ep-btn" data-from="${epnum}" data-to="${TotalEp}">${epUpperBtnText}</option>`;
                    getEpLowerList(epnum, TotalEp);
                } else {
                    html += `<option class="ep-btn" data-from="${epnum}" data-to="${TotalEp}">${epUpperBtnText}</option>`;
                }
            } else {
                epUpperBtnText = `${epnum} - ${epnum + 99}`;

                if (epnum <= current_ep && current_ep <= epnum + 99) {
                    html += `<option id="default-ep-option" class="ep-btn" data-from="${epnum}" data-to="${epnum + 99}">${epUpperBtnText}</option>`;
                    getEpLowerList(epnum, epnum + 99);
                } else {
                    html += `<option class="ep-btn" data-from="${epnum}" data-to="${epnum + 99}">${epUpperBtnText}</option>`;
                }
            }
        }
    }
    
    const epUpperDiv = document.getElementById("ep-upper-div");
    if (epUpperDiv) {
        epUpperDiv.innerHTML = html;
        const defaultOption = document.getElementById("default-ep-option");
        if (defaultOption) {
            defaultOption.selected = true;
        }
    }
    
    console.log("✅ Episode list loaded");
}

async function getEpLowerList(start, end) {
    const current_ep = Number(EpisodeID.split("-episode-")[1]);

    let html = "";
    const eplist = Episode_List.slice(start - 1, end);

    for (let i = 0; i < eplist.length; i++) {
        if (!eplist[i] || eplist[i].length < 2) continue;
        
        const episode_id = eplist[i][1];
        let epnum = Number(String(eplist[i][0]));

        let epLowerBtnText = `${epnum}`;

        if (epnum === current_ep) {
            html += `<a class="ep-btn-playing ep-btn" href="./episode.html?anime_id=${AnimeID}&episode_id=${episode_id}">${epLowerBtnText}</a>`;
        } else {
            html += `<a class="ep-btn" href="./episode.html?anime_id=${AnimeID}&episode_id=${episode_id}">${epLowerBtnText}</a>`;
        }
    }
    
    const epLowerDiv = document.getElementById("ep-lower-div");
    if (epLowerDiv) {
        epLowerDiv.innerHTML = html;
    }
}

async function episodeSelectChange(elem) {
    if (!elem || !elem.options) return;
    
    const option = elem.options[elem.selectedIndex];
    if (option) {
        getEpLowerList(
            parseInt(option.getAttribute("data-from")),
            parseInt(option.getAttribute("data-to"))
        );
    }
}

function isShortNumber(n) {
    let x = Number(String(n).replace(".", ""));
    return x < 20;
}

// Function to get episode Slider
async function getEpSlider(total) {
    if (!total || !Array.isArray(total) || total.length === 0) {
        console.warn("No episodes for slider");
        return;
    }

    let ephtml = "";

    for (let i = 0; i < total.length; i++) {
        if (!total[i] || total[i].length < 2) continue;
        
        const episodeId = total[i][1];
        const epNum = total[i][0];
        const isPlaying = episodeId === EpisodeID;
        const epClass = isPlaying ? "ep-slide ep-slider-playing" : "ep-slide";
        const epLabel = isShortNumber(epNum) ? `Episode ${epNum}` : `Ep ${epNum}`;
        const playingText = isPlaying ? " - Playing" : "";

        ephtml += `<div class="${epClass}">
            <a href="./episode.html?anime_id=${AnimeID}&episode_id=${episodeId}">
                <img onerror="retryImageLoad(this)" class="lzy_img" 
                     src="./static/loading1.gif" 
                     data-src="https://thumb.techzbots1.workers.dev/thumb/${episodeId}"
                     alt="${epLabel}">
                <div class="ep-title">
                    <span>${epLabel}${playingText}</span>
                </div>
            </a>
        </div>`;
    }
    
    const epSlider = document.getElementById("ep-slider");
    if (epSlider) {
        epSlider.innerHTML = ephtml;
    }
    
    const sliderMain = document.getElementById("slider-main");
    if (sliderMain) {
        sliderMain.style.display = "block";
    }
    
    RefreshLazyLoader();

    // Scroll to playing episode
    setTimeout(() => {
        const mainSection = document.getElementById("main-section");
        if (mainSection) {
            mainSection.style.display = "block";
        }
        
        const playingSlide = document.getElementsByClassName("ep-slider-playing")[0];
        if (playingSlide) {
            playingSlide.scrollIntoView({ behavior: "instant", inline: "start", block: "end" });
        }
        
        const playingBtn = document.getElementsByClassName("ep-btn-playing")[0];
        if (playingBtn) {
            playingBtn.scrollIntoView({ behavior: "instant", inline: "start", block: "end" });
        }
        
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });

        setTimeout(() => {
            if (mainSection) {
                mainSection.style.opacity = 1;
            }
            const loadEl = document.getElementById("load");
            if (loadEl) {
                loadEl.style.display = "none";
            }
        }, 100);
    }, 500);
}

// Retry image load
function retryImageLoad(img) {
    if (!img) return;
    
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

// Running functions
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const AnimeID = urlParams.get("anime_id");
const EpisodeID = urlParams.get("episode_id");

if (!AnimeID || !EpisodeID) {
    window.location = "./index.html";
}

async function loadEpisodeData(data) {
    if (!data || !data.results) {
        throw new Error("Invalid episode data");
    }

    data = data.results;
    const name = data.name || "Unknown Episode";

    document.documentElement.innerHTML = 
        document.documentElement.innerHTML.replaceAll("{{ title }}", name);

    const videoLoaded = await loadVideo(name, data);
    if (!videoLoaded) {
        throw new Error("Failed to load video");
    }
    
    console.log("✅ Video loaded");
}

async function loadData() {
    try {
        console.log(`🔍 Loading episode: ${EpisodeID}`);
        
        const episodeData = await getJson(episodeapi + EpisodeID);
        console.log("📦 Episode data:", episodeData);
        
        await loadEpisodeData(episodeData);

        const animeData = await getJson(animeapi + encodeURIComponent(AnimeID));
        console.log("📦 Anime data:", animeData);
        
        if (!animeData || !animeData.results || !animeData.results.episodes) {
            throw new Error("Failed to load episode list");
        }

        const eplist = animeData.results.episodes;
        await getEpUpperList(eplist);
        console.log("✅ Episode list loaded");

        try {
            await getEpSlider(eplist);
            console.log("✅ Episode Slider loaded");
        } catch (err) {
            console.error("Slider failed:", err);
            const mainSection = document.getElementById("main-section");
            if (mainSection) {
                mainSection.style.display = "block";
                mainSection.style.opacity = 1;
            }
            const loadEl = document.getElementById("load");
            if (loadEl) {
                loadEl.style.display = "none";
            }
        }
    } catch (err) {
        console.error("❌ Load data error:", err);
        
        const mainSection = document.getElementById("main-section");
        const errorPage = document.getElementById("error-page");
        const errorDesc = document.getElementById("error-desc");
        
        if (mainSection) mainSection.style.display = "none";
        if (errorPage) errorPage.style.display = "block";
        if (errorDesc) errorDesc.innerHTML = err.message || "Unknown error occurred";
    }
    
    const iframe = document.getElementById("BeatAnimesFrame");
    if (iframe) {
        iframe.focus();
    }
}

// Make functions global
window.selectServer = selectServer;
window.showDownload = showDownload;
window.plusSlides = plusSlides;
window.episodeSelectChange = episodeSelectChange;

loadData();
