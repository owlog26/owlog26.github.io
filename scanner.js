/**
 * OWLOG Scanner Engine (scanner.js)
 */

let allCharacterData = [];
let cropper = null;

/**
 * 1. 캐릭터 리스트 초기화 및 드롭다운 선택
 */
async function initHeroSelect(lang, nameToSelect = "") {
    try {
        const response = await fetch('json/hero.json');
        const data = await response.json();
        allCharacterData = data.characters;

        const select = document.getElementById('resName');
        if (!select) return;
        select.innerHTML = '';

        allCharacterData.forEach(char => {
            const option = document.createElement('option');
            const displayName = (lang === 'ko') ? char.korean_name : char.english_name;
            option.value = displayName;
            option.innerText = displayName;
            select.appendChild(option);
        });

        if (nameToSelect) {
            select.value = nameToSelect;
        } else {
            select.selectedIndex = 0;
        }
    } catch (err) {
        // console.error("Hero list load failed:", err);
    }
}

/**
 * 2. 캐릭터 이름 정밀 인식 (특수문자 제거 및 비교)
 */
async function checkCharacterName(img, worker, lang) {
    const isCropped = (img.width / img.height) < 1.3;

    let nx = img.width * 0.13, ny = img.height * 0.015;
    let nw = img.width * 0.35, nh = img.height * 0.11;

    if (!isCropped) nx = 0.45 + (nx * 0.55);

    const nCanvas = document.createElement('canvas');
    const nCtx = nCanvas.getContext('2d');
    nCanvas.width = nw * 5;
    nCanvas.height = nh * 5;

    nCtx.filter = 'grayscale(1) contrast(3.5) brightness(1.2)';
    nCtx.drawImage(img, nx, ny, nw, nh, 0, 0, nCanvas.width, nCanvas.height);

    const { data } = await worker.recognize(nCanvas);
    const detectedRaw = data.text.trim();
    const detectedClean = detectedRaw.replace(/[^가-힣a-zA-Z]/g, '').trim();

    const heroList = allCharacterData.map(c => (lang === 'ko' ? c.korean_name : c.english_name));

    for (let heroName of heroList) {
        if (detectedClean.toLowerCase().includes(heroName.toLowerCase()) && heroName.length > 0) {
            return heroName;
        }
    }

    let match = heroList[0], min = 99;
    heroList.forEach(h => {
        const score = levenshtein(detectedClean.toLowerCase(), h.toLowerCase());
        if (score < min) { min = score; match = h; }
    });
    return match;
}

/**
 * OWLOG - OCR 스캐너 엔진
 */
async function runMainScan(img) {
    const currentLang = localStorage.getItem('owlog_lang') || 'en';
    const saveBtn = document.getElementById('saveBtn');
    const statusText = document.getElementById('status');
    const debugText = document.getElementById('debug-raw-text');
    const debugContainer = document.getElementById('debug-canvas-container');

    saveBtn.disabled = true;
    statusText.innerText = (currentLang === 'ko') ? ">> 데이터 정밀 분석 중..." : ">> DEEP SCANNING...";
    statusText.classList.add('text-blue-500', 'animate-pulse');
    if (debugContainer) debugContainer.innerHTML = ''; 

    const worker = await Tesseract.createWorker('kor+eng');

    try {
        const isCropped = (img.width / img.height) < 1.3;
        const regions = {
            time:  { x: 0.73, y: 0.18, w: 0.23, h: 0.09 },
            stage: { x: 0.77, y: 0.48, w: 0.22, h: 0.09 }, 
            level: { x: 0.77, y: 0.58, w: 0.22, h: 0.09 }, 
            total: { x: 0.12, y: 0.92, w: 0.30, h: 0.07 }
        };

        if (!isCropped) {
            Object.keys(regions).forEach(k => { 
                regions[k].x = 0.45 + (regions[k].x * 0.55); 
            });
        }

        async function scanRegion(roi, labelName) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const sw = img.width * roi.w, sh = img.height * roi.h;
            
            canvas.width = sw * 4; canvas.height = sh * 4;
            ctx.filter = 'grayscale(1) contrast(3) brightness(1.1)';
            ctx.drawImage(img, img.width * roi.x, img.height * roi.y, sw, sh, 0, 0, canvas.width, canvas.height);

            if (debugContainer) {
                const wrapper = document.createElement('div');
                wrapper.className = "flex flex-col items-center border border-slate-700 p-1 bg-slate-800";
                const label = document.createElement('span');
                label.className = "text-[8px] text-blue-300 mb-1 font-mono";
                label.innerText = labelName;
                wrapper.appendChild(label);
                wrapper.appendChild(canvas);
                canvas.style.width = "100px"; 
                debugContainer.appendChild(wrapper);
            }

            const { data } = await worker.recognize(canvas);
            return data.text.trim();
        }

        const [detectedName, rawTime, rawStage, rawLevel, rawTotal] = await Promise.all([
            checkCharacterName(img, worker, currentLang),
            scanRegion(regions.time, 'TIME'),
            scanRegion(regions.stage, 'STAGE'),
            scanRegion(regions.level, 'LEVEL'),
            scanRegion(regions.total, 'TOTAL')
        ]);

        await initHeroSelect(currentLang, detectedName);

        let res = { time: "00:00", stage: "1", level: "0", total: "0" };

        const extractLastNumber = (text, defaultVal) => {
            let cleanedText = text.replace(/[니ㄴyY:]|L\]/g, '4');
            const nums = cleanedText.match(/\d+/g);
            if (!nums) return defaultVal;
            let val = parseInt(nums[nums.length - 1]) || defaultVal;
            return (val > 11 ? 11 : val).toString();
        };

        res.stage = extractLastNumber(rawStage, "1");
        res.level = extractLastNumber(rawLevel, "0");

        const tM = rawTime.match(/\d{1,2}[:;.\s]\d{2}/);
        if (tM) res.time = tM[0].replace(/[;.\s]/g, ':').padStart(5, '0');

        const totalNums = rawTotal.match(/\d+/g);
        if (totalNums) res.total = parseInt(totalNums.join('')).toLocaleString();

        if (debugText) {
            debugText.innerText = `[RAW DATA]\nTime: ${rawTime}\nStage: ${rawStage}\nLevel: ${rawLevel}\nTotal: ${rawTotal}`;
        }

        // 전역 변수 lastScannedData에 저장 (script.js 등에서 접근)
        lastScannedData = {
            time: res.time, level: res.level, stage: res.stage,
            totalScore: parseInt(res.total.replace(/,/g, ''))
        };

        // UI 업데이트 (OWL 전용 ID)
        document.getElementById('resStage').innerText = res.stage;
        document.getElementById('resTime').innerText = res.time;
        document.getElementById('resLevel').innerText = res.level;
        document.getElementById('resTotal').innerText = res.total;

        const totalNum = lastScannedData.totalScore;
        const isDetected = res.time !== "00:00" && res.level !== "0";

        if (isDetected && totalNum > 10000) {
            saveBtn.disabled = false;
            statusText.innerText = (currentLang === 'ko') ? "분석 완료" : "COMPLETE";
            statusText.classList.replace('text-blue-500', 'text-green-500');
        } else {
            saveBtn.disabled = true;
            statusText.classList.replace('text-blue-500', 'text-red-500');
            statusText.innerText = (isDetected && totalNum <= 10000)
                ? (currentLang === 'ko' ? "10,000점 이하 등록 불가" : "SCORE TOO LOW")
                : (currentLang === 'ko' ? "인식 실패 (데이터 확인)" : "SCAN FAILED");
        }

    } catch (err) {
        console.error(err);
        statusText.innerText = "ERROR";
    } finally {
        statusText.classList.remove('animate-pulse');
        await worker.terminate();
    }
}

/**
 * 3. 이미지 선택 리스너 (수정됨)
 * 직접 크로퍼를 실행하지 않고 script.js의 공용 모달 함수를 호출합니다.
 */
const imageInput = document.getElementById('imageInput');
if (imageInput) {
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            // script.js의 공용 함수 호출 + 분석 완료 후 'runMainScan'을 실행하도록 예약
            if (typeof openCropModal === 'function') {
                openCropModal(event.target.result, runMainScan);
            }
        };
        reader.readAsDataURL(file);
        e.target.value = ""; // 동일 파일 재선택 가능하게 초기화
    });
}

/**
 * 중복 방지를 위해 기존 confirmCrop, closeCropModal 함수는 삭제되었습니다.
 * 이 기능들은 이제 script.js에서 통합 관리됩니다.
 */

function levenshtein(a, b) {
    const m = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= b.length; m[0][j] = j++);
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
        }
    }
    return m[a.length][b.length];
}
