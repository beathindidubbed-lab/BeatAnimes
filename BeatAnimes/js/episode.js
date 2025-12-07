// BeatAnimes/js/episode.js - FIXED: Better Telegram Streaming

const animeapi = "/anime/";
const episodeapi = "/episode/";
const AvailableServers = ["https://beatanimesapi-h6gt.onrender.com"];

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
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (errors) {
        console.error(`Fetch error:`, errors);
        return getJson(path, errCount + 1);
    }
}

// ✅ FIXED: Better video loading with Telegram support
async function loadVideo(name, episodeData) {
    console.log("🎬 Loading video:", name);
    
    try {
        const epNameEl = document.getElementById("ep-name");
        if (epNameEl) epNameEl.innerHTML = name;
        
        const serversbtn = document.getElementById("serversbtn");
        if (!serversbtn) throw new Error("Servers button container not found");

        if (episodeData.variants && episodeData.variants.length > 0) {
            console.log("✅ Found variants:", episodeData.variants.length);
            
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
                    
                    html += `<div class="sitem">
                        <a class="sobtn ${active}"
                           onclick="selectTelegramServer(this)"
                           data-channel="${variant.channelName || ''}"
                           data-msgid="${variant.messageId || ''}"
                           data-direct-url="${variant.directUrl || ''}"
                           data-video-url="${variant.videoUrl || ''}">
                           ${variant.quality} ${variant.language}
                        </a>
                    </div>`;
                });

                html += '</div>';
            });
            
            serversbtn.innerHTML = html;
            return true;
        }
        
        throw new Error("No video sources available");
    } catch (err) {
        console.error("❌ loadVideo error:", err);
        return false;
    }
}

// ✅ FIXED: Properly handle Telegram streaming
window.selectTelegramServer = async function(btn) {
    console.log('🖱️ Server button clicked');

    if (!btn) return;

    const videoContainer = document.getElementById("video");
    if (!videoContainer) return;

    const channelName = btn.getAttribute("data-channel");
    const messageId = btn.getAttribute("data-msgid");
    let directUrl = btn.getAttribute("data-direct-url");
    const videoUrl = btn.getAttribute("data-video-url");
    const quality = btn.textContent.trim();

    // Clean direct URL
    if (directUrl) {
        directUrl = directUrl.trim().replace(/^["']|["']$/g, '');
    }

    // Mark as active
    document.querySelectorAll(".sobtn").forEach(b => b.classList.remove("sactive"));
    btn.classList.add("sactive");

    // Show loading
    videoContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; flex-direction: column; gap: 20px;">
            <i class="fa fa-spinner fa-spin" style="font-size: 40px;"></i>
            <p>Loading video...</p>
        </div>
    `;

    try {
        // ✅ Priority 1: Direct URL from caption
        if (directUrl && directUrl !== 'null' && directUrl !== 'undefined' && 
            (directUrl.startsWith('http://') || directUrl.startsWith('https://'))) {
            
            console.log('✅ Using direct URL:', directUrl);
            videoContainer.innerHTML = `
                <iframe id="BeatAnimesFrame"
                    src="./embed.html?url=${encodeURIComponent(directUrl)}&episode_id=${encodeURIComponent(EpisodeID)}"
                    style="border: 0px; width: 100%; height: 100%;"
                    scrolling="no" frameborder="0" allowfullscreen>
                </iframe>
            `;
            return;
        }

        // ✅ Priority 2: Try direct streaming (no API call needed)
        if (channelName && messageId) {
            const ApiServer = getApiServer();
            const directStreamUrl = `${ApiServer}/direct-stream/${channelName}/${messageId}`;
            
            console.log('✅ Using direct stream URL:', directStreamUrl);

            videoContainer.innerHTML = `
                <iframe id="BeatAnimesFrame"
                    src="./embed.html?url=${encodeURIComponent(directStreamUrl)}&episode_id=${encodeURIComponent(EpisodeID)}"
                    style="border: 0px; width: 100%; height: 100%;"
                    scrolling="no" frameborder="0" allowfullscreen>
                </iframe>
            `;
            return;
        }

        // ✅ Fallback: Telegram web link with beautiful UI
        const telegramUrl = `https://t.me/${channelName}/${messageId}`;
        console.log('⚠️ Falling back to Telegram:', telegramUrl);

        videoContainer.innerHTML = `
            <div style="
                display: flex; flex-direction: column; align-items: center;
                justify-content: center; height: 100%;
                background: linear-gradient(135deg, #2a2b2f 0%, #1a1a2e 100%);
                border-radius: 8px; padding: 40px 20px;
            ">
                <div style="
                    background: linear-gradient(to right, #eb3349, #f45c43);
                    width: 80px; height: 80px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 25px; box-shadow: 0 8px 20px rgba(235, 51, 73, 0.4);
                ">
                    <i class="fa fa-telegram" style="font-size: 40px; color: white;"></i>
                </div>

                <h3 style="color: white; font-family: 'Montserrat', sans-serif; 
                    font-size: 22px; margin-bottom: 15px; text-align: center;">
                    Watch on Telegram
                </h3>

                <p style="color: #999; font-family: 'Montserrat', sans-serif; 
                    font-size: 14px; margin-bottom: 30px; text-align: center; max-width: 400px;">
                    Quality: <strong style="color: #eb3349;">${quality}</strong>
                </p>

                <a href="${telegramUrl}" target="_blank" style="
                    background: linear-gradient(to right, #eb3349, #f45c43);
                    color: white; padding: 15px 40px; border-radius: 50px;
                    text-decoration: none; font-family: 'Montserrat', sans-serif;
                    font-size: 16px; font-weight: 600;
                    box-shadow: 0 4px 15px rgba(235, 51, 73, 0.3);
                    transition: all 0.3s; display: inline-flex;
                    align-items: center; gap: 10px;
                " onmouseover="this.style.transform='scale(1.05)'" 
                   onmouseout="this.style.transform='scale(1)'">
                    <i class="fa fa-play-circle"></i>
                    Open in Telegram
                </a>

                <p style="color: #666; font-family: 'Montserrat', sans-serif;
                    font-size: 12px; margin-top: 20px; text-align: center;">
                    Video will open in Telegram app
                </p>
            </div>
        `;

    } catch (error) {
        console.error('❌ Error:', error);
        videoContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; color: white;">
                <h3 style="color: #eb3349; margin-bottom: 20px;">Failed to Load Video</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="
                    background: #eb3349; color: white; padding: 12px 30px;
                    border: none; border-radius: 25px; cursor: pointer;
                    font-size: 16px; margin-top: 20px;">
                    <i class="fa fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
};

// Language switcher
window.switchLanguage = function(language) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === language) btn.classList.add('active');
    });
    
    document.querySelectorAll('.quality-selector').forEach(s => s.style.display = 'none');
    const target = document.querySelector(`.quality-${language}`);
    if (target) target.style.display = 'block';
    
    const firstBtn = document.querySelector(`.quality-${language} .sobtn`);
    if (firstBtn) {
        document.querySelectorAll('.sobtn').forEach(b => b.classList.remove('sactive'));
        firstBtn.classList.add('sactive');
        selectTelegramServer(firstBtn);
    }
};

// Episode list functions
let Episode_List = [];

async function getEpUpperList(eplist) {
    if (!eplist || eplist.length === 0) return;

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
                    html += `<option id="default-ep-option" data-from="${epnum}" data-to="${TotalEp}">${epUpperBtnText}</option>`;
                    getEpLowerList(epnum, TotalEp);
                } else {
                    html += `<option data-from="${epnum}" data-to="${TotalEp}">${epUpperBtnText}</option>`;
                }
            } else {
                epUpperBtnText = `${epnum} - ${epnum + 99}`;
                if (epnum <= current_ep && current_ep <= epnum + 99) {
                    html += `<option id="default-ep-option" data-from="${epnum}" data-to="${epnum + 99}">${epUpperBtnText}</option>`;
                    getEpLowerList(epnum, epnum + 99);
                } else {
                    html += `<option data-from="${epnum}" data-to="${epnum + 99}">${epUpperBtnText}</option>`;
                }
            }
        }
    }
    
    const epUpperDiv = document.getElementById("ep-upper-div");
    if (epUpperDiv) {
        epUpperDiv.innerHTML = html;
        const defaultOption = document.getElementById("default-ep-option");
        if (defaultOption) defaultOption.selected = true;
    }
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
    if (epLowerDiv) epLowerDiv.innerHTML = html;
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

// Episode Slider
async function getEpSlider(total) {
    if (!total || !Array.isArray(total) || total.length === 0) return;

    let ephtml = "";
    for (let i = 0; i < total.length; i++) {
        if (!total[i] || total[i].length < 2) continue;
        const episodeId = total[i][1];
        const epNum = total[i][0];
        const isPlaying = episodeId === EpisodeID;
        const epClass = isPlaying ? "ep-slide ep-slider-playing" : "ep-slide";
        
        ephtml += `<div class="${epClass}" style="
            background: linear-gradient(135deg, #35373d 0%, #2a2b2f 100%);
            border: 2px solid ${isPlaying ? '#ed3832' : '#ffffff'};
            border-radius: 8px; padding: 20px; text-align: center;
            min-width: 120px; height: 100px; display: flex;
            align-items: center; justify-content: center; flex-direction: column;
            margin: 0 10px; transition: all 0.3s;
        ">
            <a href="./episode.html?anime_id=${AnimeID}&episode_id=${episodeId}" style="
                text-decoration: none; width: 100%; height: 100%;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
            ">
                <div style="
                    color: ${isPlaying ? '#ed3832' : '#ffffff'};
                    font-family: 'Montserrat', sans-serif;
                    font-size: 20px; font-weight: 700; margin-bottom: 5px;
                ">EP ${epNum}</div>
                ${isPlaying ? `<div style="color: #ed3832; font-size: 12px; font-weight: 600;">▶ PLAYING</div>` : ''}
            </a>
        </div>`;
    }
    
    const epSlider = document.getElementById("ep-slider");
    if (epSlider) epSlider.innerHTML = ephtml;
    
    const sliderMain = document.getElementById("slider-main");
    if (sliderMain) sliderMain.style.display = "block";

    setTimeout(() => {
        const mainSection = document.getElementById("main-section");
        if (mainSection) mainSection.style.display = "block";
        
        const playingSlide = document.getElementsByClassName("ep-slider-playing")[0];
        if (playingSlide) playingSlide.scrollIntoView({ behavior: "instant", inline: "start" });
        
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });

        setTimeout(() => {
            if (mainSection) mainSection.style.opacity = 1;
            const loadEl = document.getElementById("load");
            if (loadEl) loadEl.style.display = "none";
        }, 100);
    }, 500);
}

// Scroll slider
function plusSlides(n) {
    const carousel = document.getElementById("slider-carousel");
    if (!carousel) return;
    const windowWidth = window.innerWidth;
    if (n === 1) carousel.scrollLeft += windowWidth / 2;
    else if (n === -1) carousel.scrollLeft -= windowWidth / 2;
}

// Get URL parameters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const AnimeID = urlParams.get("anime_id");
const EpisodeID = urlParams.get("episode_id");

if (!AnimeID || !EpisodeID) {
    window.location = "./index.html";
}

async function loadEpisodeData(data) {
    if (!data || !data.results) throw new Error("Invalid episode data");
    data = data.results;
    const name = data.name || "Unknown Episode";

    document.documentElement.innerHTML = 
        document.documentElement.innerHTML.replaceAll("{{ title }}", name);

    const videoLoaded = await loadVideo(name, data);
    if (!videoLoaded) throw new Error("Failed to load video");
    
    // ✅ Auto-select first server
    setTimeout(() => {
        const firstBtn = document.querySelector('.sobtn.sactive');
        if (firstBtn) selectTelegramServer(firstBtn);
    }, 1000);
}

async function loadData() {
    try {
        const episodeData = await getJson(episodeapi + EpisodeID);
        await loadEpisodeData(episodeData);

        const animeData = await getJson(animeapi + encodeURIComponent(AnimeID));
        if (!animeData || !animeData.results || !animeData.results.episodes) {
            throw new Error("Failed to load episode list");
        }

        const eplist = animeData.results.episodes;
        await getEpUpperList(eplist);
        await getEpSlider(eplist);
    } catch (err) {
        console.error("❌ Load error:", err);
        const errorPage = document.getElementById("error-page");
        if (errorPage) {
            errorPage.style.display = "block";
            document.getElementById("error-desc").innerHTML = err.message;
        }
        document.getElementById("load").style.display = "none";
    }
}

// Make functions global
window.selectTelegramServer = selectTelegramServer;
window.switchLanguage = switchLanguage;
window.plusSlides = plusSlides;
window.episodeSelectChange = episodeSelectChange;

loadData();

