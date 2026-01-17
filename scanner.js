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

    // [좌표] dds.png 빨간 박스 위치
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

    // [보정] 기호(/) 등을 제거하고 순수 언어 텍스트만 추출
    const detectedRaw = data.text.trim();
    const detectedClean = detectedRaw.replace(/[^가-힣a-zA-Z]/g, '').trim();

    const heroList = allCharacterData.map(c => (lang === 'ko' ? c.korean_name : c.english_name));

    // 1순위: 포함 관계 혹은 완전 일치 확인
    for (let heroName of heroList) {
        if (detectedClean.toLowerCase().includes(heroName.toLowerCase()) && heroName.length > 0) {
            return heroName;
        }
    }

    // 2순위: 유사도 비교
    let match = heroList[0], min = 99;
    heroList.forEach(h => {
        const score = levenshtein(detectedClean.toLowerCase(), h.toLowerCase());
        if (score < min) { min = score; match = h; }
    });
    return match;
}

/**
 * OWLOG - OCR 스캐너 엔진 (사용자 지정 '니' 매핑 반영 버전)
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

    // 인식이 가장 잘 되었던 기본 워커 설정 (한글+영어)
    const worker = await Tesseract.createWorker('kor+eng');

    try {
        const isCropped = (img.width / img.height) < 1.3;

        /**
         * [좌표 복구] 사용자님이 제공한 가장 정확한 초기 좌표계 적용
         */
        const regions = {
            time:  { x: 0.73, y: 0.18, w: 0.23, h: 0.09 },
            stage: { x: 0.77, y: 0.48, w: 0.22, h: 0.09 }, 
            level: { x: 0.77, y: 0.58, w: 0.22, h: 0.09 }, 
            total: { x: 0.12, y: 0.92, w: 0.30, h: 0.07 }
        };

        if (!isCropped) {
            Object.keys(regions).forEach(k => { 
                // 전체 화면일 때의 $x$ 좌표 오프셋 계산
                regions[k].x = 0.45 + (regions[k].x * 0.55); 
            });
        }

        async function scanRegion(roi, labelName) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const sw = img.width * roi.w, sh = img.height * roi.h;
            
            canvas.width = sw * 4; canvas.height = sh * 4;
            // 대비(contrast) 3 설정으로 이미지 뭉개짐 방지
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

        // 스캔 실행
        const [detectedName, rawTime, rawStage, rawLevel, rawTotal] = await Promise.all([
            checkCharacterName(img, worker, currentLang),
            scanRegion(regions.time, 'TIME'),
            scanRegion(regions.stage, 'STAGE'),
            scanRegion(regions.level, 'LEVEL'),
            scanRegion(regions.total, 'TOTAL')
        ]);

        await initHeroSelect(currentLang, detectedName);

        let res = { time: "00:00", stage: "1", level: "0", total: "0" };

        /**
         * [추출 로직 수정] 
         * '니', 'y', 'Y', ':' 등 도트 폰트 '4'로 오인되는 문자를 사전에 치환합니다.
         */
        const extractLastNumber = (text, defaultVal) => {
            // 텍스트 전처리: '니', 'y', ':' 등을 '4'로 변경
            let cleanedText = text.replace(/[니ㄴyY:]|L\]/g, '4');
            
            const nums = cleanedText.match(/\d+/g);
            if (!nums) return defaultVal;
            
            let val = parseInt(nums[nums.length - 1]) || defaultVal;
            // 11단계 제한 로직 유지
            return (val > 11 ? 11 : val).toString();
        };

        res.stage = extractLastNumber(rawStage, "1");
        res.level = extractLastNumber(rawLevel, "0");

        // 시간 보정
        const tM = rawTime.match(/\d{1,2}[:;.\s]\d{2}/);
        if (tM) res.time = tM[0].replace(/[;.\s]/g, ':').padStart(5, '0');

        // 합계 보정
        const totalNums = rawTotal.match(/\d+/g);
        if (totalNums) res.total = parseInt(totalNums.join('')).toLocaleString();

        if (debugText) {
            debugText.innerText = `[RAW DATA]\nTime: ${rawTime}\nStage: ${rawStage}\nLevel: ${rawLevel}\nTotal: ${rawTotal}`;
        }

        // 메모리 저장
        lastScannedData = {
            time: res.time, level: res.level, stage: res.stage,
            totalScore: parseInt(res.total.replace(/,/g, ''))
        };

        // UI 업데이트
        document.getElementById('resStage').innerText = res.stage;
        document.getElementById('resTime').innerText = res.time;
        document.getElementById('resLevel').innerText = res.level;
        document.getElementById('resTotal').innerText = res.total;

        // 최종 유효성 검사 (고통 레벨이 0보다 커야 함)
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

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const cropTarget = document.getElementById('cropTarget');
        cropTarget.src = event.target.result;
        document.getElementById('cropModal').classList.remove('hidden');
        if (cropper) cropper.destroy();
        setTimeout(() => {
            cropper = new Cropper(cropTarget, {
                aspectRatio: NaN,
                viewMode: 1,
                dragMode: 'crop',
                autoCropArea: 0.9,
                background: false
            });
        }, 150);
    };
    reader.readAsDataURL(file);
});

function confirmCrop() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ maxWidth: 2000, maxHeight: 2000 });
    closeCropModal();
    runMainScan(canvas);
}

function closeCropModal() {
    document.getElementById('cropModal').classList.add('hidden');
    if (cropper) { cropper.destroy(); cropper = null; }
    document.getElementById('imageInput').value = "";
}

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