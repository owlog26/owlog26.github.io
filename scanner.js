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
        console.error("Hero list load failed:", err);
    }
}

/**
 * 2. 캐릭터 이름 정밀 인식 및 '완전 일치' 우선 매칭
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

    // 이름 영역 전처리 (기호 제거를 위해 대비 강화)
    nCtx.filter = 'grayscale(1) contrast(3.5) brightness(1.2)';
    nCtx.drawImage(img, nx, ny, nw, nh, 0, 0, nCanvas.width, nCanvas.height);

    const { data } = await worker.recognize(nCanvas);
    
    // 기호(/) 제거 및 영문/한글만 추출
    const detectedRaw = data.text.trim();
    const detectedClean = detectedRaw.replace(/[^가-힣a-zA-Z]/g, '').trim(); 

    const heroList = allCharacterData.map(c => (lang === 'ko' ? c.korean_name : c.english_name));
    
    // 1순위: 완전 일치 혹은 포함 관계 확인
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
 * 3. 메인 스캔 함수 (ROI 기반 수치 분석)
 */
async function runMainScan(img) {
    const currentLang = localStorage.getItem('owlog_lang') || 'en';
    const saveBtn = document.getElementById('saveBtn'); 
    const statusText = document.getElementById('status');
    const debugText = document.getElementById('debug-raw-text');
    
    saveBtn.disabled = true;
    statusText.innerText = (currentLang === 'ko') ? ">> 정밀 분석 중..." : ">> DEEP SCANNING...";
    statusText.classList.remove('text-green-500', 'text-red-500');
    statusText.classList.add('text-blue-500', 'animate-pulse');

    const worker = await Tesseract.createWorker('kor+eng');

    try {
        const isCropped = (img.width / img.height) < 1.3;
        
        // [좌표 설정] 가이드 이미지 기반
        const regions = {
            time:    { x: 0.73, y: 0.18, w: 0.23, h: 0.09 },
            enemies: { x: 0.73, y: 0.28, w: 0.23, h: 0.09 },
            level:   { x: 0.83, y: 0.58, w: 0.13, h: 0.09 },
            total:   { x: 0.12, y: 0.92, w: 0.30, h: 0.07 } 
        };

        if (!isCropped) {
            Object.keys(regions).forEach(k => { regions[k].x = 0.45 + (regions[k].x * 0.55); });
        }

        async function scanRegion(roi) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const sw = img.width * roi.w, sh = img.height * roi.h;
            canvas.width = sw * 4; canvas.height = sh * 4;
            ctx.filter = 'grayscale(1) contrast(3) brightness(1.1)';
            ctx.drawImage(img, img.width * roi.x, img.height * roi.y, sw, sh, 0, 0, canvas.width, canvas.height);
            const { data } = await worker.recognize(canvas);
            return data.text.trim();
        }

        // 영역별 스캔 및 이름 인식
        const [detectedName, rawTime, rawEnemies, rawLevel, rawTotal] = await Promise.all([
            checkCharacterName(img, worker, currentLang),
            scanRegion(regions.time),
            scanRegion(regions.enemies),
            scanRegion(regions.level),
            scanRegion(regions.total)
        ]);

        // 캐릭터 선택 동기화
        await initHeroSelect(currentLang, detectedName);

        if (debugText) {
            debugText.innerText = `[SCAN RESULT]\n- Name: ${detectedName}\n- Time: ${rawTime}\n- Level: ${rawLevel}\n- Total: ${rawTotal}`;
        }

        let res = { time: "00:00", enemies: "0", level: "0", total: "0" };
        const pN = (v) => v.replace(/[gq]/g, '9').replace(/[Bs]/g, '3').replace(/[^0-9]/g, '');

        // [시간 보정]
        const tM = rawTime.match(/\d{1,2}[:;.\s]\d{2}/);
        if (tM) res.time = tM[0].replace(/[;.\s]/g, ':').padStart(5, '0');

        res.enemies = pN(rawEnemies) || "0";
        res.level = pN(rawLevel) || "0";

        // [합계 점수 필터링] 5자리 제한 및 불순물 제거
        const totalNums = rawTotal.match(/\d+/g);
        if (totalNums) {
            let sStr = totalNums[totalNums.length - 1]; // 마지막 뭉치 추출
            if (parseInt(sStr) > 99999) sStr = sStr.slice(-5); // 최대 99999 제한
            res.total = parseInt(sStr).toLocaleString();
        }

        // UI 업데이트
        document.getElementById('resTime').innerText = res.time;
        document.getElementById('resEnemies').innerText = res.enemies;
        document.getElementById('resLevel').innerText = res.level;
        document.getElementById('resTotal').innerText = res.total;

        // 최종 유효성 검사
        if (res.time !== "00:00" && res.level !== "0") {
            saveBtn.disabled = false;
            statusText.innerText = (currentLang === 'ko') ? "분석 완료" : "COMPLETE";
            statusText.classList.replace('text-blue-500', 'text-green-500');
        } else {
            statusText.classList.replace('text-blue-500', 'text-red-500');
            statusText.innerText = (currentLang === 'ko') ? "인식 실패" : "SCAN FAILED";
        }

    } catch (err) {
        console.error(err);
    } finally {
        await worker.terminate();
    }
}

/**
 * 4. 이미지 크로퍼 및 유틸리티
 */
const imageInput = document.getElementById('imageInput');
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