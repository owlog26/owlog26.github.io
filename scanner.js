/**
 * OWLOG Scanner Engine (scanner.js)
 */

let allCharacterData = [];
/**
 * OWLOG Scanner Engine (scanner.js)
 */

// [수정] 드롭다운 리스트를 채우고, 특정 이름을 선택해주는 기능을 하나로 합침
async function initHeroSelect(lang, nameToSelect = "") {
    try {
        const response = await fetch('json/hero.json');
        const data = await response.json();
        allCharacterData = data.characters;
        
        const select = document.getElementById('resName');
        
        // 1. 기존 옵션( - 포함)을 모두 비움
        select.innerHTML = ''; 

        // 2. 리스트 채우기
        allCharacterData.forEach(char => {
            const option = document.createElement('option');
            const displayName = (lang === 'ko') ? char.korean_name : char.english_name;
            option.value = displayName;
            option.innerText = displayName;
            select.appendChild(option);
        });

        // 3. 이름 선택 (값이 넘어온 경우에만)
        if (nameToSelect) {
            select.value = nameToSelect;
        } else {
            // 값이 없으면 첫 번째 항목을 기본값으로 하거나 비워둠
            select.selectedIndex = 0;
        }
    } catch (err) {
        console.error("Hero list load failed:", err);
    }
}

/**
 * OWLOG Scanner Engine (scanner.js)
 * 전체 분석 프로세스 및 UI 제어 로직
 */
async function runMainScan(img) {
    const currentLang = localStorage.getItem('owlog_lang') || 'en';
    const select = document.getElementById('resName');
    const saveBtn = document.getElementById('saveBtn'); // 저장 버튼
    
    // 1. 초기화 및 준비 상태
    // 스캔 시작 시 드롭다운은 '-'로, 버튼은 비활성화(disabled)로 설정
    saveBtn.disabled = true;
    select.innerHTML = '<option value="">-</option>';
    
    statusText.innerText = (currentLang === 'ko') ? ">> 분석 중..." : ">> SCANNING...";
    statusText.classList.remove('text-green-500');
    statusText.classList.add('text-blue-500', 'animate-pulse');

    // Tesseract 워커 생성
    const worker = await Tesseract.createWorker('kor+eng');

    try {
        // 2. 수치 데이터 추출을 위한 캔버스 전처리
        const mainCanvas = document.createElement('canvas');
        const mCtx = mainCanvas.getContext('2d');
        const rx = img.width * 0.50, rw = img.width * 0.50;
        mainCanvas.width = rw * 3; mainCanvas.height = img.height * 3;
        mCtx.filter = 'contrast(2.5) grayscale(1) brightness(1.2)';
        mCtx.drawImage(img, rx, 0, rw, img.height, 0, 0, mainCanvas.width, mainCanvas.height);

        // 3. OCR 실행 (수치 데이터)
        const { data } = await worker.recognize(mainCanvas);
        let res = { time: "00:00", enemies: "0", level: "0", total: "0" };

        data.lines.forEach(line => {
            const originalText = line.text.trim();
            const cleanText = originalText.replace(/\s+/g, '').toLowerCase();

            // 시간 (Time)
            if (cleanText.includes(':')) {
                const m = originalText.match(/\d{1,2}:\d{2}/);
                if (m) res.time = m[0];
            }
            // 처치 수 (Enemies)
            if (cleanText.includes('적') || cleanText.includes('enem')) {
                const nums = originalText.match(/\d+/g);
                if (nums) res.enemies = nums[nums.length - 1];
            }
            // 고통 레벨 (Anguish Level)
            if (cleanText.includes('level') || cleanText.includes('고통') || cleanText.includes('anguish')) {
                const lvNums = originalText.match(/\d+/g);
                if (lvNums) res.level = lvNums[lvNums.length - 1];
            }
            // 합계 점수 (Total Score)
            if (cleanText.includes('합계') || cleanText.includes('total')) {
                const score = originalText.match(/\d{3,}/);
                if (score) res.total = parseInt(score[0]).toLocaleString();
            }
        });

        // 4. 이름 영역 정밀 인식 및 유사도 매칭
        const detectedName = await checkCharacterName(img, worker, currentLang);

        // 5. [핵심] 분석이 완료된 시점에 리스트를 생성하고 인식된 이름을 자동 선택
        // 이 함수 내부에서 select.innerHTML이 채워지고 detectedName이 value로 박힙니다.
        await initHeroSelect(currentLang, detectedName);

        // 6. 결과 텍스트 UI 바인딩
        document.getElementById('resTime').innerText = res.time;
        document.getElementById('resEnemies').innerText = res.enemies;
        document.getElementById('resLevel').innerText = res.level;
        document.getElementById('resTotal').innerText = res.total;
       
        // 7. [핵심] 모든 분석 완료 후 저장 버튼 활성화
        saveBtn.disabled = false;

        statusText.innerText = (currentLang === 'ko') ? "분석 완료" : "COMPLETE";
        statusText.classList.remove('animate-pulse');
        statusText.classList.replace('text-blue-500', 'text-green-500');

    } catch (err) {
        console.error("Scanning Error:", err);
        statusText.innerText = "ERROR";
        statusText.classList.remove('animate-pulse');
    } finally {
        await worker.terminate();
    }
}

// [1] JSON에서 캐릭터 리스트 로드 및 드롭다운 초기화

const imageInput = document.getElementById('imageInput');
const statusText = document.getElementById('status');

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
   
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
        await runMainScan(img);
    };
});

// [3] 캐릭터 이름 정밀 인식 및 유사도 비교
async function checkCharacterName(img, worker, lang) {
    const nCanvas = document.getElementById('nameDebugCanvas');
    const nCtx = nCanvas.getContext('2d');
    const nx = img.width * 0.62, ny = img.height * 0.045;
    const nw = img.width * 0.26, nh = img.height * 0.11;

    nCanvas.width = nw * 5; nCanvas.height = nh * 5;
    const tCtx = document.createElement('canvas').getContext('2d');
    tCtx.canvas.width = img.width; tCtx.canvas.height = img.height;
    tCtx.drawImage(img, 0, 0);
    const iData = tCtx.getImageData(nx, ny, nw, nh);
    const p = iData.data;

    for (let i = 0; i < p.length; i += 4) {
        const isYellow = (p[i] > 150 && p[i+1] > 140 && p[i+2] < 120);
        p[i] = p[i+1] = p[i+2] = isYellow ? 0 : 255; 
    }
    
    const bmp = await createImageBitmap(iData);
    nCtx.imageSmoothingEnabled = false;
    nCtx.drawImage(bmp, 0, 0, nw, nh, 0, 0, nCanvas.width, nCanvas.height);

    const { data } = await worker.recognize(nCanvas);
    let detected = (lang === 'ko') ? data.text.replace(/[^가-힣]/g, '') : data.text.replace(/[^a-zA-Z\s]/g, '').trim();

    // 유사도 비교를 위한 리스트 생성
    const heroList = allCharacterData.map(c => (lang === 'ko' ? c.korean_name : c.english_name));
    
    let match = heroList[0];
    let min = 99;
    heroList.forEach(h => {
        const score = levenshtein(detected.toLowerCase(), h.toLowerCase());
        if (score < min) { min = score; match = h; }
    });
    return match;
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