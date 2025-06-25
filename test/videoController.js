// videoController.js

// 전역 스텁 정의 (Unity 호출 전 에러 방지용)
window.startSequence = window.startSequence || function (langIdx) {
    console.warn('startSequence not ready yet:', langIdx);
};
window.skipToMarker = window.skipToMarker || function (markerName, langIdx) {
    console.warn('skipToMarker not ready yet:', markerName, langIdx);
};

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
    const popup1Text = document.getElementById("js-popup1-text");
    const popup2 = document.getElementById("js-popup2");
    const popup2Text = document.getElementById("js-popup2-text");
    const popup2Close = document.getElementById("js-popup2-close");
    const skipBtn = document.getElementById("js-skip");
    const player = videojs('unityVideo');
    const wrap = () => player.el();

    // QR 트래킹 제어
    function stopTracking() {
        try {
            if (iTracker?.stop) iTracker.stop();
            if (arCamera?.pause) arCamera.pause();
            unityInstance?.SendMessage('ImageTracker_1', 'StopTracker');
        } catch (e) {
            console.warn('트래킹 중단 실패:', e);
        }
    }
    function startTracking() {
        try {
            if (iTracker?.start) iTracker.start();
            if (arCamera?.resume) arCamera.resume();
            unityInstance?.SendMessage('ImageTracker_1', 'StartTracker');
        } catch (e) {
            console.warn('트래킹 재개 실패:', e);
        }
    }

    // 팝업 분기용 마커
    const popup1Markers = ["marker2_1", "marker2_2", "marker3_1"];
    const immediateReturn = ["marker1_1", "marker2_3", "marker3_2"];

    const popup1Texts = {
        marker2_1: { kr: "2.8독립선언", en: "2.8 Declaration of Independence", ch: "2.8独立宣言", jp: "2.8独立宣言" },
        marker2_2: { kr: "제3차공산당사건", en: "Third Communist Party incident", ch: "第三次共产党事件", jp: "第三次共産党事件" },
        marker3_1: { kr: "대일굴욕외교", en: "diplomacy against Japan", ch: "对日屈辱外交", jp: "対日屈辱外交" }
    };

    // 2차 팝업 텍스트 맵
    const popup2Texts = {
        marker2_1: {
            kr: `2·8 독립 선언은 1919년 2월 8일, 일본에 유학하던 한국 청년들이 우리나라의 독립을 강하게 요구하며 발표한 선언이에요. 당시 일본이 우리나라를 지배하고 있어서, 많은 사람들이 자유를 잃고 고통받고 있었어요. 이에 도쿄에 있던 유학생들이 “우리나라는 스스로 독립할 권리가 있다”며 목소리를 냈죠. 이 선언은 이후 3·1 운동이 일어나는 데 큰 계기가 되었고, 많은 이들에게 독립에 대한 희망을 전해주었어요.`,
            en: `The February 8, 1919 Declaration of Independence was made by young Koreans studying in Japan, strongly demanding for Korea's independence. At that time, Japan ruled our country, so many people lost their freedom and were suffering. In response, international students in Tokyo voiced their opinions, saying, "Our country has the right to independence itself." This declaration served as a great opportunity for the March 1st Movement and gave many people hope for independence.`,
            ch: `《2·8独立宣言》是1919年2月8日，留学日本的韩国青年强烈要求韩国独立而发表的宣言。当时日本统治着韩国，很多人失去自由，饱受痛苦。对此,在东京的留学生发出了"我们国家有权自行独立"的声音。该宣言成为此后三一运动的巨大契机，给很多人带来了独立的希望。`,
            jp: `2·8独立宣言は1919年2月8日、日本に留学していた韓国の青年たちが韓国の独立を強く求めて発表した宣言です。当時、日本が私たちの国を支配していて、多くの人々が自由を失い苦しんでいました。これに対して東京にいた留学生たちが「韓国は自ら独立する権利がある」と声を上げました。この宣言は以後、3·1運動が起きるのに大きな契機になり、多くの人々に独立に対する希望を伝えました。`
        },
        marker2_2: {
            kr: `제3차 조선공산당 사건은 1928년에 일어난 일이에요. 당시 우리나라를 지배하고 있던 일본은 한국 사람들이 힘을 모아 활동하는 것을 막으려고 했어요. 그래서 비밀 모임을 만들고 독립을 꿈꾸던 조선공산당이라는 단체의 주요 인물들을 잡아들이기 시작했어요. 이 사건으로 조선공산당의 지도자들이 체포되었지만, 다른 사람들은 포기하지 않고 다시 모여 회의를 열고 새 지도자를 뽑았어요. 하지만 얼마 지나지 않아 일본 경찰이 다시 이들을 대거 체포하면서 결국 이 단체는 더 이상 활동을 이어가지 못하게 되었답니다.`,
            en: `The Third Communist Party of Korea happened in 1928. Japan, which ruled the country at the time, tried to stop Koreans from joining forces to work. So they formed a secret group and started to catch key figures from a group called the Korean Communist Party, who dreamed of independence. This arrested the leaders of the communist party, but the others didn't give up and held a meeting again to elect a new leader. However, shortly after, the Japanese police arrested them again in large numbers, and eventually the group was no longer able to continue its activities.`,
            ch: `第3次朝鲜共产党事件是1928年发生的事情。当时统治我国的日本试图阻止韩国人齐心协力进行活动。因此，他们组成了秘密聚会，开始抓捕梦想独立的朝鲜共产党这一团体的主要人物。虽然朝鲜共产党的领导人因该事件被捕,但其他人没有放弃,而是重新聚在一起开会,选出了新的领导人。但是没过多久，日本警察再次大举逮捕了他们，结果这个团体无法继续活动了。`,
            jp: `第3次朝鮮共産党事件は1928年に起きたことです。当時、韓国を支配していた日本は韓国人らが力を合わせて活動するのを防ごうとしました。それで秘密会を作り、独立を夢見ていた朝鮮共産党という団体の主要人物を逮捕し始めました。この事件で朝鮮共産党の指導者が逮捕されたが、他の人たちはあきらめずに再び集まって会議を開き、新しい指導者を選びました。しかし、まもなく日本の警察がまたこれらを逮捕し、結局、この団体はこれ以上活動を続けることができないようになりました。`
        },
        marker3_1: {
            kr: `1964년, 박정희 정부는 우리나라 경제를 발전시키기 위해 일본과 협상을 시작했어요. 당시 박정희 대통령은 일본과 관계를 개선하면 경제에 도움이 될 거라고 생각했죠. 그래서 일본과 대화를 통해 지원을 받으려 했지만, 이 과정에서 문제가 생겼어요. 사람들은 일본이 과거 우리나라를 지배했던 일에 대해 충분히 사과하거나 보상하지 않았다고 생각했어요. 그래서 많은 사람들이 “우리나라의 자존심을 지키지 못한 게 아닌가?”라며 불만을 느꼈고, 정부의 외교 방식을 ‘대일 굴욕 외교’라고 부르며 비판했어요. 당시에는 이 문제로 많은 사람들이 모여 “우리나라의 자존심을 지켜야 한다”고 정부에 강하게 요구하기도 했어요. 이 사건을 통해 우리 나라 사람들이 독립과 자존심을 얼마나 중요하게 생각했는지 알 수 있어요.`,
            en: `In 1964, the Park Chung-hee administration started negotiations with Japan to develop Korea's economy. At the time, President Park thought that improving relations with Japan would help the economy. So, I tried to get support through dialogue with Japan, but I got in trouble in this process. People thought that Japan did not apologize or compensate enough for what had dominated our country in the past. So many people felt dissatisfied, saying, "Didn't we fail to keep our country's pride?" and criticized the government's diplomatic style, calling it "humiliating diplomacy with Japan." At that time, many people gathered over this issue and strongly demanded the government to "protect our country's self-esteem." This incident shows how much the Korean people valued independence and self-esteem.`,
            ch: `1964年，朴正熙政府为了发展我国经济，开始与日本进行协商。当时朴正熙总统认为，如果与日本改善关系，将会对经济有所帮助。所以想通过与日本的对话得到支援，但在此过程中出现了问题。人们认为日本过去没有就支配我国的事情进行充分的道歉或补偿。因此,很多人不满地说:"是不是没能守护我国的自尊心?",并批评政府的外交方式是"对日屈辱外交" 当时,很多人因为这个问题聚集在一起,向政府强烈要求"要守护我国的自尊心" 通过这件事，可以看出我们国家的人是多么重视独立和自尊心。`,
            jp: `1964年、朴正熙政府は我が国の経済を発展시키기 위해日本と交渉を始めました。当時の朴正熙大統領は、日本との関係を改善すれば経済に役立つと考えていました。それで日本との対話を通じて支援を受けようとしましたが、この過程で問題が生じました。人々は、日本が過去に私たちの国を支配したことについて十分に謝罪したり補償したりしていないと考えました。それで多くの人が「我が国の自尊心を守れなかったのではないか」と不満を感じ、政府の外交方式を「対日屈辱外交」と呼び批判しました。当時はこの問題で多くの人々が集まり「我が国の自尊心を守らなければならない」と政府に強く要求したりもしました。この事件を通じて我が国の人々が独立と自尊心をどれほど重要だと考えたかが分かります。`
        }
    };

    // 영상 재생 함수
    function playCurrent() {
        window.unityInstance?.SendMessage('ImageTracker_1', 'StopTracker');
        const marker = sequence[seqIdx];
        const url = `StreamingAssets/videos/${marker}_${currentLang}.mp4`;

        // AR 숨기고 비디오 화면
        unity.style.display = 'none';
        popup1.classList.remove('visible');
        popup2.style.display = 'none';
        skipBtn.classList.add('visible');

        const v = wrap();
        v.style.zIndex = '50';
        v.style.display = 'block';
        v.style.opacity = '0';
        v.style.transition = 'opacity 0.3s ease';

        player.src({ type: 'video/mp4', src: url });
        stopTracking();
        player.play().catch(e => {
            if (e.name !== 'AbortError') console.error(e);
        });
        setTimeout(() => v.style.opacity = '1', 50);
    }

    // AR 복귀 함수
    function showUnity(marker) {
        window.unityInstance?.SendMessage('STAGE_mng', 'OnJsVideoEnded', marker);
        player.pause();
        wrap().style.display = 'none';
        skipBtn.classList.remove('visible');
        popup1.classList.remove('visible');
        popup2.style.display = 'none';

        unity.style.display = 'block';
        unity.style.zIndex = '100';

        // 트래킹 재개 + Unity 콜백
        RequestWebcam().then(() => {
            StartWebcam?.();
            startTracking();
            
        });
    }

    // 영상 종료 처리
    player.on('ended', () => {
        const marker = sequence[seqIdx];
        if (popup1Markers.includes(marker)) {
            popup1Text.textContent = popup1Texts[marker][currentLang];
            popup1.classList.add('visible');
        } else {
            showUnity(marker);
        }
    });

    // 1차 팝업 클릭 → 2차 팝업
    popup1.addEventListener('click', () => {
        popup1.classList.remove('visible');
        const marker = sequence[seqIdx];
        popup2Text.textContent = popup2Texts[marker][currentLang];
        popup2.style.display = 'block';
    });

    // 2차 팝업 닫기 → 다음 영상
    popup2Close.addEventListener('click', () => {
        popup2.style.display = 'none';
        if (seqIdx < sequence.length - 1) {
            seqIdx++;
            playCurrent();
        }
    });

    // SKIP 버튼 클릭
    skipBtn.addEventListener('click', () => {
        const marker = sequence[seqIdx];
        player.pause();
        if (immediateReturn.includes(marker)) {
            showUnity(marker);
        } else {
            seqIdx++;
            playCurrent();
        }
    });

    // Unity → JS 실제 구현
    window.startSequence = (langIdx) => {
        currentLang = ['kr', 'en', 'ch', 'jp'][langIdx] || 'kr';
        seqIdx = 0;
        playCurrent();
    };
    window.skipToMarker = (markerName, langIdx) => {
        currentLang = ['kr', 'en', 'ch', 'jp'][langIdx] || currentLang;
        const idx = sequence.indexOf(markerName);
        if (idx >= 0) {
            seqIdx = idx;
            playCurrent();
        }
    };
});
