// videoController.js
document.addEventListener('DOMContentLoaded', () => {
    const sequence = [
        "marker1_1",
        "marker2_1", "marker2_2", "marker2_3",
        "marker3_1", "marker3_2"
    ];
    let seqIdx = 0;
    let currentLang = "kr";

    const unity = document.getElementById("unity-container");
    const popup1 = document.getElementById("js-popup1");
    const popup1Btn = document.getElementById("js-popup1-btn");
    const popup2 = document.getElementById("js-popup2");
    const popup2Txt = document.getElementById("js-popup2-text");
    const popup2Cls = document.getElementById("js-popup2-close");
    const jsSkip = document.getElementById("js-skip");
    const player = videojs('unityVideo');
    const wrap = () => player.el();

    function _playCurrent() {
        const name = sequence[seqIdx];
        const url = `StreamingAssets/videos/${name}_${currentLang}.mp4`;

        unity.style.display = "none";
        popup1.style.display = "none";
        popup2.style.display = "none";
        jsSkip.style.display = "block";

        try {
            if (window.arCamera && arCamera.stopWebcam) {
                arCamera.stopWebcam();
            }
        } catch (e) { }

        const w = wrap();
        w.style.zIndex = "50";
        w.style.display = "block";
        w.style.opacity = "0";
        w.style.transition = "opacity 0.3s ease";

        player.src({ type: "video/mp4", src: url });
        player.play().catch(e => {
            if (e.name !== 'AbortError') console.error("play() 실패:", e);
        });

        setTimeout(() => w.style.opacity = "1", 50);
    }

    function proceed() {
        seqIdx++;
        if (seqIdx < sequence.length) {
            _playCurrent();
        } else {
            const w = wrap();
            w.style.opacity = "0";
            w.style.display = "none";
            unity.style.display = "block";
            unity.style.zIndex = "100";
            RequestWebcam().then(() => {
                if (window.StartWebcam) StartWebcam();
            });
            window.unityInstance?.SendMessage("STAGE_mng", "OnJsVideoEnded", sequence[seqIdx - 1]);
        }
    }

    popup1Btn.addEventListener("click", () => {
        popup1.style.display = "none";
        const marker = sequence[seqIdx];
        popup2Txt.textContent = {
            "marker2_1": "여기는 Marker2_1 설명입니다.",
            "marker2_2": "여기는 Marker2_2 설명입니다.",
            "marker3_1": "여기는 Marker3_1 설명입니다."
        }[marker] || "";
        popup2.style.display = "block";
    });

    popup2Cls.addEventListener("click", () => {
        popup2.style.display = "none";
        RequestWebcam().then(() => {
            if (window.StartWebcam) StartWebcam();
        });
        proceed();
    });

    jsSkip.addEventListener("click", () => {
        player.pause();
        popup1.style.display = "none";
        popup2.style.display = "none";
        jsSkip.style.display = "none";

        const marker = sequence[seqIdx];
        const w = wrap();

        if (["marker1_1", "marker2_3", "marker3_2"].includes(marker)) {
            w.style.opacity = "0";
            w.style.display = "none";
            unity.style.display = "block";
            unity.style.zIndex = "100";
            RequestWebcam().then(() => {
                if (window.StartWebcam) StartWebcam();
            });
            return window.unityInstance?.SendMessage("STAGE_mng", "OnJsVideoEnded", marker);
        }

        RequestWebcam().then(() => {
            if (window.StartWebcam) StartWebcam();
        });
        proceed();
    });

    window.startSequence = function (langIdx) {
        currentLang = ["kr", "en", "ch", "jp"][langIdx] || "kr";
        seqIdx = 0;
        _playCurrent();
    };

    window.skipToMarker = function (markerName, langIdx) {
        // 언어도 함께 업데이트
        currentLang = ["kr", "en", "ch", "jp"][langIdx] || currentLang;
        const idx = sequence.indexOf(markerName);
        if (idx >= 0) {
            seqIdx = idx;
            _playCurrent();
        }
    };

    player.on("ended", () => {
        const marker = sequence[seqIdx];
        const w = wrap();

        if (["marker1_1", "marker2_3", "marker3_2"].includes(marker)) {
            w.style.opacity = "0";
            w.style.display = "none";
            unity.style.display = "block";
            unity.style.zIndex = "100";
            RequestWebcam().then(() => {
                if (window.StartWebcam) StartWebcam();
            });
            return window.unityInstance?.SendMessage("STAGE_mng", "OnJsVideoEnded", marker);
        }

        if (["marker2_1", "marker2_2", "marker3_1"].includes(marker)) {
            w.style.opacity = "1";
            w.style.display = "block";
            popup1.style.display = "block";
            RequestWebcam().then(() => {
                if (window.StartWebcam) StartWebcam();
            });
            return;
        }
    });
});
