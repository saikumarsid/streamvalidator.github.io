async function fetchHeartbeats(streamUrl) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { type: "PLAYBACK_CONTROL", state: "LOAD", timestamp: new Date().toLocaleString("en-GB", { hour12: false }) },
                { type: "PLAYBACK_STATE", state: "LOADING", timestamp: new Date().toLocaleString("en-GB", { hour12: false }) },
                { type: "PLAYBACK_STATE", state: "LOADED", timestamp: new Date().toLocaleString("en-GB", { hour12: false }) },
                { type: "HTTP_REQUEST_STATE", id: Math.random() * 1000, state: "COMPLETE", timestamp: new Date().toLocaleString("en-GB", { hour12: false }) },
            ]);
        }, 1000);
    });
}

async function startValidation() { 
    const hlsUrl = document.getElementById("hlsInput").value;
    const dashUrl = document.getElementById("dashInput").value;
    const smoothUrl = document.getElementById("smoothInput").value;

    // HLS setup with autoplay
    if (hlsUrl && window.Hls && Hls.isSupported()) {
        const hls = new Hls();
        const hlsPlayer = document.getElementById("hlsPlayer");

        hls.loadSource(hlsUrl);
        hls.attachMedia(hlsPlayer);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            hlsPlayer.play().catch((error) => {
                console.error("HLS autoplay failed:", error);
                alert("HLS stream loaded, but autoplay was blocked. Click play to start.");
            });
        });

        logHeartbeats("hls", await fetchHeartbeats(hlsUrl), hlsPlayer);
    }

    // DASH setup
    if (dashUrl && window.dashjs) {
        const dash = dashjs.MediaPlayer().create();
        dash.initialize(document.getElementById("dashPlayer"), dashUrl, true);
        logHeartbeats("dash", await fetchHeartbeats(dashUrl), document.getElementById("dashPlayer"));
    }

    // Smooth Streaming setup using dash.js
    if (smoothUrl && window.dashjs) {
        const smooth = dashjs.MediaPlayer().create();
        smooth.initialize(document.getElementById("smoothPlayer"), smoothUrl, true);
        logHeartbeats("smooth", await fetchHeartbeats(smoothUrl), document.getElementById("smoothPlayer"));
    }
}

function logHeartbeats(type, data, player) {
    const logBox = document.getElementById(`${type}Logs`);
    logBox.value = "";

    let heartbeatInterval;
    const logEntry = (entry) => {
        logBox.value += `[${entry.timestamp}] ${entry.type} - ${entry.state}\n`;
        logBox.scrollTop = logBox.scrollHeight;
    };

    data.forEach(logEntry);

    const startLogging = () => {
        if (!heartbeatInterval) {
            heartbeatInterval = setInterval(() => {
                logEntry({
                    type: "HEARTBEAT",
                    state: "PLAYING",
                    timestamp: new Date().toLocaleString("en-GB", { hour12: false }),
                });
            }, 2000);
        }
    };

    const stopLogging = () => {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        logEntry({ type: "HEARTBEAT", state: "PAUSED", timestamp: new Date().toLocaleString("en-GB", { hour12: false }) });
    };

    player.addEventListener("play", startLogging);
    player.addEventListener("pause", stopLogging);
    player.addEventListener("ended", stopLogging);
}

function clearCache() {
    ["hlsInput", "dashInput", "smoothInput", "hlsLogs", "dashLogs", "smoothLogs"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("errorInfo").innerHTML = "";
}

document.getElementById("generalInfo").innerText = `Device Info: ${navigator.userAgent}`;
