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

function sentenceCase(str) {
    if (!str || str === null || str === "") return "";
    str = str.toString();
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function capitalizeFirstLetter(string) {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to get m3u8 url of episode
async function loadVideo(name, stream) {
    try {
        if (!name || !stream) {
            throw new Error("Missing episode data");
        }

        const epNameEl = document.getElementById("ep-name");
        if (epNameEl) {
            epNameEl.innerHTML = name;
        }
        
        const serversbtn = document.getElementById("serversbtn");
        if (!serversbtn) {
            throw new Error("Servers button container not found");
        }

        // Check if stream has sources
        if (!stream.sources || !Array.isArray(stream.sources) || stream.sources.length === 0) {
            throw new Error("No streaming sources available");
        }

        let url = stream.sources[0].file;
        serversbtn.innerHTML += `<div class="sitem">
            <a class="sobtn sactive" onclick="selectServer(this)" 
               data-value="./embed.html?url=${encodeURIComponent(url)}&episode_id=${EpisodeID}">
               AD Free 1
            </a>
        </div>`;
        
        const activeBtn = document.getElementsByClassName("sactive")[0];
        if (activeBtn) {
            activeBtn.click();
        }

        // Add backup source if available
        if (stream.sources_bk && Array.isArray(stream.sources_bk) && stream.sources_bk.length > 0) {
            let backupUrl = stream.sources_bk[0].file;
            serversbtn.innerHTML += `<div class="sitem">
                <a class="sobtn" onclick="selectServer(this)" 
                   data-value="./embed.html?url=${encodeURIComponent(backupUrl)}&episode_id=${EpisodeID}">
                   AD Free 2
                </a>
            </div>`;
        }

        return true;
    } catch (err) {
        console.error("loadVideo error:", err);
        return false;
    }
}

// Function to available servers
async function loadServers(servers, success = true) {
    if (!servers || typeof servers !== 'object') {
        console.warn("No servers data available");
        return;
    }

    const serversbtn = document.getElementById("serversbtn");
    if (!serversbtn) return;

    let html = "";

    for (let [key, value] of Object.entries(servers)) {
        if (key !== "vidcdn" && value) {
            key = capitalizeFirstLetter(key);
            if (key === "Streamwish") {
                html += `<div class="sitem">
                    <a class="sobtn" onclick="selectServer(this,true)" data-value="${value}">${key}</a>
                </div>`;
            } else {
                html += `<div class="sitem">
                    <a class="sobtn" onclick="selectServer(this)" data-value="${value}">${key}</a>
                </div>`;
            }
        }
    }
    
    serversbtn.innerHTML += html;

    if (success === false) {
        const firstBtn = document.getElementsByClassName("sobtn")[0];
        if (firstBtn) {
            firstBtn.click();
        }
    }
}

// Function to select server
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

    getDownloadLinks(EpisodeID).then(() => {
        console.log("Download links loaded");
    }).catch(err => {
        console.error("Failed to load download links:", err);
    });
}

// Function to get episode list
let Episode_List = [];

async function getEpUpperList(eplist) {
    if (!eplist || !Array.isArray(eplist) || eplist.length === 0) {
        console.warn("No episodes available");
        return;
    }

    const current_ep = Number(EpisodeID.split("-episode-")[1].replace("-", "."));
    Episode_List = eplist;
    const TotalEp = eplist.length;
    let html = "";

    for (let i = 0; i < eplist.length; i++) {
        if (!eplist[i] || !eplist[i][0]) continue;
        
        const epnum = Number(String(eplist[i][0]).replaceAll("-", "."));

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
    
    console.log("Episode list loaded");
}

async function getEpLowerList(start, end) {
    const current_ep = Number(EpisodeID.split("-episode-")[1].replace("-", "."));

    let html = "";
    const eplist = Episode_List.slice(start - 1, end);

    for (let i = 0; i < eplist.length; i++) {
        if (!eplist[i] || eplist[i].length < 2) continue;
        
        const episode_id = eplist[i][1];
        let epnum = Number(String(eplist[i][0]).replaceAll("-", "."));

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

// Function to get download links
async function getDownloadLinks(episodeId) {
    if (!episodeId) {
        console.error("No episode ID provided");
        return;
    }

    try {
        const data = await getJson(dlapi + episodeId);
        
        if (!data || !data.results) {
            throw new Error("No download data received");
        }

        let html = "";
        const results = data.results;

        for (const [key, value] of Object.entries(results)) {
            if (!value) continue;
            
            const quality = key.split("x")[1] || key;
            html += `<div class="sitem">
                <a class="sobtn download" target="_blank" href="${value}">
                    <i class="fa fa-download"></i>${quality}p
                </a>
            </div>`;
        }
        
        const dlLinks = document.getElementById("dllinks");
        if (dlLinks) {
            dlLinks.innerHTML = html || '<p style="color: white; padding: 10px;">No download links available</p>';
        }
    } catch (err) {
        console.error("getDownloadLinks error:", err);
        const dlLinks = document.getElementById("dllinks");
        if (dlLinks) {
            dlLinks.innerHTML = '<p style="color: red; padding: 10px;">Failed to load download links</p>';
        }
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
    const stream = data.stream;
    const servers = data.servers || {};

    document.documentElement.innerHTML = 
        document.documentElement.innerHTML.replaceAll("{{ title }}", name);

    try {
        if (!stream) {
            throw new Error("No streaming data available");
        }
        
        const videoLoaded = await loadVideo(name, stream);
        if (videoLoaded) {
            console.log("Video loaded");
            await loadServers(servers, true);
            console.log("Servers loaded");
        } else {
            throw new Error("Failed to load video");
        }
    } catch (err) {
        console.warn("Primary video loading failed, trying alternate servers:", err);
        await loadServers(servers, false);
        console.log("Alternate servers loaded");
    }
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
        console.log("Episode list loaded");

        try {
            await getEpSlider(eplist);
            console.log("Episode Slider loaded");
        } catch (err) {
            console.error("Slider failed, showing page anyway:", err);
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
        console.error("Load data error:", err);
        
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

loadData();
