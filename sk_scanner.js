/**
 * OWLOG - sk_scanner.js
 */
let skLastScannedData = { time: '00:00', mode: 'Unknown', totalScore: 0, level: 0 };


/**
 * 초기화: 모드 선택 시 selectMode에서 호출됨
 */
function initSKScanner() {
    const skInput = document.getElementById('skImageInput');
    if (skInput) skInput.onchange = handleSKImageUpload;

    populateSKRegions(); // isoCodes 활용
    loadSKHeroData();
}

/**
 * 이미지 선택 및 크랍 모달 오픈
 */
function handleSKImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        // script.js의 공용 openCropModal 함수 호출
        openCropModal(event.target.result, confirmSKCrop);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
}

/**
 * 구역별 OCR 인식 및 디버그 이미지 생성
 */
async function recognizeSKRegion(canvas, region, label) {
    const { x, y, w, h } = region;
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    tempCanvas.width = canvas.width * w;
    tempCanvas.height = canvas.height * h;
    
    ctx.drawImage(canvas, canvas.width * x, canvas.height * y, canvas.width * w, canvas.height * h, 0, 0, tempCanvas.width, tempCanvas.height);

    // [디버그 뷰 시각화]
    const debugContainer = document.getElementById('sk-debug-canvas-container');
    if (debugContainer) {
        const wrapper = document.createElement('div');
        wrapper.className = "flex flex-col items-center p-1 bg-white/5 rounded";
        tempCanvas.className = "border border-orange-500 max-w-[100px]";
        wrapper.innerHTML = `<span class="text-[8px] text-orange-300">${label}</span>`;
        wrapper.appendChild(tempCanvas);
        debugContainer.appendChild(wrapper);
    }
    
    const { data: { text } } = await Tesseract.recognize(tempCanvas, 'kor+eng');
    const resultText = text.trim();

    const debugText = document.getElementById('sk-debug-raw-text');
    if (debugText) debugText.innerText += `[${label}]: ${resultText}\n`;

    return resultText;
}

/**
 * 크랍 확정 및 최종 분석
 */
async function confirmSKCrop(croppedCanvas) {
   // closeCropModal();
    document.getElementById('sk-debug-canvas-container').innerHTML = '';
    document.getElementById('sk-debug-raw-text').innerText = '';
    
    const status = document.getElementById('skStatus');
    status.innerText = "Analyzing SK Results...";

    try {
        /**
         * 구역 설정 (1a1a.png 기준)
         * DAMAGE 좌표를 아래로 하향 조정함
         */
        const regions = {
            time:  { x: 0.74, y: 0.05, w: 0.22, h: 0.10 },
            mode:  { x: 0.42, y: 0.30, w: 0.18, h: 0.08 },
            score: { x: 0.80, y: 0.88, w: 0.18, h: 0.07 } 
        };

        const [rawTime, rawMode, rawScore] = await Promise.all([
            recognizeSKRegion(croppedCanvas, regions.time, "TIME"),
            recognizeSKRegion(croppedCanvas, regions.mode, "MODE"),
            recognizeSKRegion(croppedCanvas, regions.score, "DAMAGE")
        ]);

        // [1] 시간 정제: 00:10:05 -> 10:05
        let timeFormatted = rawTime.replace(/[^0-9:]/g, '');
        if (timeFormatted.startsWith('00:')) timeFormatted = timeFormatted.substring(3);
        skLastScannedData.time = timeFormatted || "00:00";

        // [2] 모드 판별: 퍼지 매칭 처리
        const modeLower = rawMode.replace(/\s+/g, '').toLowerCase();
        const isVoid = modeLower.includes("공허") || modeLower.includes("공히") || 
                       modeLower.includes("void") || modeLower.includes("vold") || modeLower.includes("v0id");
        skLastScannedData.mode = isVoid ? "SK" : "Unknown";

        // [3] 데미지 정제
        skLastScannedData.totalScore = parseInt(rawScore.replace(/[^0-9]/g, '')) || 0;

        updateSKScannerUI();
        status.innerText = "Analysis Complete";
        document.getElementById('skSaveBtn').disabled = !isVoid;

    } catch (error) {
        console.error("SK OCR Error:", error);
        status.innerText = "Analysis Failed";
    }
}

/**
 * 스캔 결과를 UI에 반영
 */
function updateSKScannerUI() {
    document.getElementById('skResTime').innerText = skLastScannedData.time;
    document.getElementById('skResTotal').innerText = skLastScannedData.totalScore.toLocaleString();
    
    const modeEl = document.getElementById('skResMode');
    if (skLastScannedData.mode === "SK") {
        modeEl.innerText = "OK (VOID)";
        modeEl.className = "font-bold px-3 py-1 bg-white rounded-lg shadow-sm text-[10px] text-green-500";
    } else {
        modeEl.innerText = "CHECK MODE";
        modeEl.className = "font-bold px-3 py-1 bg-white rounded-lg shadow-sm text-[10px] text-red-500";
    }
}

/**
 * script.js의 isoCodes를 활용하여 국가 목록 생성
 */
function populateSKRegions() {
    const select = document.getElementById('skUserRegion');
    if (!select || typeof isoCodes === 'undefined') return;

    const lang = localStorage.getItem('owlog_lang') || 'en';
    const regionNames = new Intl.DisplayNames([lang], { type: 'region' });

    select.innerHTML = '';
    isoCodes.forEach(code => {
        const opt = document.createElement('option');
        opt.value = code;
        try {
            opt.text = regionNames.of(code);
        } catch (e) {
            opt.text = code.toUpperCase();
        }
        select.add(opt);
    });
}

/**
 * 영웅 데이터 로드 (sk_hero.json)
 */
async function loadSKHeroData() {
    const select = document.getElementById('skResName');
    try {
        const res = await fetch('json/sk_hero.json');
        skHeroDataCache = await res.json();
        const lang = localStorage.getItem('owlog_lang') || 'ko';

        skHeroDataCache.characters.forEach(hero => {
            const opt = document.createElement('option');
            opt.value = hero.english_name;
            opt.text = lang === 'ko' ? hero.korean_name : hero.english_name;
            select.add(opt);
        });
    } catch (e) {
        console.warn("sk_hero.json load error");
    }
}

/**
 * 최종 서버 저장
 */
async function saveSKRecord() {
    const lang = localStorage.getItem('owlog_lang') || 'ko';
    const saveBtn = document.getElementById('skSaveBtn');
    
    const region = document.getElementById('skUserRegion').value;
    const nickname = document.getElementById('skUserNickname').value.trim();
    const charName = document.getElementById('skResName').value;

    if (!nickname || !charName) {
        alert(lang === 'ko' ? "모든 정보를 입력해주세요." : "Please fill in all information.");
        return;
    }

    saveBtn.disabled = true;
    saveBtn.innerText = lang === 'ko' ? "저장 중..." : "Saving...";

    try {
        const payload = {
            userId: nickname,
            region: region,
            character: charName,
            time: `'${skLastScannedData.time}`, // '10:05 형식 저장
            totalScore: skLastScannedData.totalScore,
            mode: "SK",
            level: 0,
            stage: 1
        };

        // GAS_URL은 script.js에 정의된 것을 공유
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        alert(lang === 'ko' ? "기록이 저장되었습니다!" : "Record saved!");
        location.reload(); 
    } catch (error) {
        location.reload(); 
    }
}
