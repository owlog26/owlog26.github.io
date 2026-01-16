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
 * 3. 메인 스캔 함수 (적 정보 제거 및 수치 보정 강화)
 */
async function runMainScan(img) {
    const currentLang = localStorage.getItem('owlog_lang') || 'en';
    const saveBtn = document.getElementById('saveBtn');
    const statusText = document.getElementById('status');
    const debugText = document.getElementById('debug-raw-text');

    saveBtn.disabled = true;
    statusText.innerText = (currentLang === 'ko') ? ">> 데이터 정밀 분석 중..." : ">> DEEP SCANNING...";
    statusText.classList.remove('text-green-500', 'text-red-500');
    statusText.classList.add('text-blue-500', 'animate-pulse');

    const worker = await Tesseract.createWorker('kor+eng');

    try {
        const isCropped = (img.width / img.height) < 1.3;

        // [좌표 설정] 가이드 이미지 기반 (적 처치 제거, 레벨 폭 확대)
        // [수정] 적 처치(enemies) 삭제 및 level 영역 확장
        const regions = {
            time: { x: 0.73, y: 0.18, w: 0.23, h: 0.09 },
            level: { x: 0.77, y: 0.58, w: 0.22, h: 0.09 }, // 폭을 0.22로 늘려 '11' 인식 대비
            total: { x: 0.12, y: 0.92, w: 0.30, h: 0.07 }
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

        // [수정] 적 정보 스캔 제거
        const [detectedName, rawTime, rawLevel, rawTotal] = await Promise.all([
            checkCharacterName(img, worker, currentLang),
            scanRegion(regions.time),
            scanRegion(regions.level),
            scanRegion(regions.total)
        ]);

        await initHeroSelect(currentLang, detectedName);

        if (debugText) {
            debugText.innerText = `[SCAN RESULT]\n- Name: ${detectedName}\n- Time: ${rawTime}\n- Level: ${rawLevel}\n- Total: ${rawTotal}`;
        }

        let res = { time: "00:00", level: "0", total: "0" };

        // [시간 보정]
        // A. [시간] 스프레드시트 '분:초' 인식용 보정
        // [수정] 홑따옴표(')를 추가하여 스프레드시트의 자동 시간 변환 방지
        const tM = rawTime.match(/\d{1,2}[:;.\s]\d{2}/);
        if (tM) {
            const timeStr = tM[0].replace(/[;.\s]/g, ':').padStart(5, '0'); // MM:SS 추출
            // 앞에 '를 붙여 "문자열"임을 명시 (시트에서 27:45로 정확히 표시됨)
            res.time = `${timeStr}`;
        }
        // B. [레벨] 배율 기호 제외하고 마지막 숫자 '11'만 추출
        const lvNumbers = rawLevel.replace(/[SIl|]/g, '1').match(/\d+/g);
        if (lvNumbers) res.level = lvNumbers[lvNumbers.length - 1];

        // C. [합계] 마지막 숫자 뭉치에서 뒤의 5자리만 취함
        const totalNums = rawTotal.match(/\d+/g);
        if (totalNums) {
            let sStr = totalNums[totalNums.length - 1];
            if (parseInt(sStr) > 99999) sStr = sStr.slice(-5); // 5자리 제한
            res.total = parseInt(sStr).toLocaleString();
        }

        // [추가] 스캔 성공 시 원본 데이터를 변수에 안전하게 보관
        lastScannedData = {
            time: res.time,
            level: res.level,
            totalScore: parseInt(res.total.replace(/,/g, ''))
        };

        // UI 업데이트 (화면에 보여주는 용도일 뿐, 저장 시에는 쓰지 않음)
        document.getElementById('resTime').innerText = res.time;
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
        statusText.innerText = "ERROR";
    } finally {
        await worker.terminate();
    }
}

/**
 * 4. 이미지 크로퍼 및 유틸리티
 */
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