/**
 * OWLOG - script.js
 */
let translations = {};
// ISO 3166-1 alpha-2 전체 리스트 (US, KR 우선 배치 후 알파벳순)
const isoCodes = [
    "US", "KR", // 우선 순위
    "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ",
    "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BV", "BR", "IO",
    "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO",
    "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG",
    "SV", "GQ", "ER", "EE", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE",
    "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA",
    "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JE", "JO", "KZ",
    "KE", "KI", "KP", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MK",
    "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN",
    "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "AN", "NC", "NZ", "NI", "NE", "NG", "NU", "NF",
    "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA",
    "RE", "RO", "RU", "RW", "SH", "KN", "LC", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC",
    "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "GS", "ES", "LK", "SD", "SR", "SJ", "SZ", "SE", "CH",
    "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG",
    "UA", "AE", "GB", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"
];

/**
 * 1. 페이지 로드 시 URL 파라미터 확인 (id=nickname)
 */
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    // 2. '?howtoregister' 또는 '?tab=guide' 파라미터가 있는지 확인
    // 사용자가 owlog.zyx/?howtoregister 로 접속했을 때
    if (urlParams.has('howtoregister')) {
        switchHomeTab('guide');
    }
    // 1. ?ranking 파라미터가 있는 경우
    else if (urlParams.has('ranking')) {
        switchTab('ranking'); // 랭킹 탭으로 이동
        loadMainRanking();    // 데이터 로드 및 로더 제어 실행
        window.scrollTo({ top: 0, behavior: 'smooth' }); // 상단으로 부드럽게 이동
    }
    // (선택사항) 확장성을 위해 ?tab=guide 형태도 지원하고 싶다면:
    else if (urlParams.get('tab') === 'guide') {
        switchHomeTab('guide');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadLang();
    initRegionSelect();
});
async function loadLang() {
    try {
        const response = await fetch('json/idle.json');
        translations = await response.json();
        // [1] 디폴트 영어 설정 (로컬 스토리지 확인)
        const savedLang = localStorage.getItem('owlog_lang') || 'en';
        await changeLang(savedLang);
    } catch (error) {
        console.error("Lang load error:", error);
    }
}

async function changeLang(lang) {
    if (!translations[lang]) return;
    localStorage.setItem('owlog_lang', lang);

    // [2] 언어 버튼 불 들어오게 스타일 변경 (완벽 처리)
    const btnKo = document.getElementById('btn-ko');
    const btnEn = document.getElementById('btn-en');

    if (lang === 'ko') {
        btnKo.classList.add('text-black', 'font-black');
        btnKo.classList.remove('text-gray-400', 'font-normal');
        btnEn.classList.add('text-gray-400', 'font-normal');
        btnEn.classList.remove('text-black', 'font-black');
    } else {
        btnEn.classList.add('text-black', 'font-black');
        btnEn.classList.remove('text-gray-400', 'font-normal');
        btnKo.classList.add('text-gray-400', 'font-normal');
        btnKo.classList.remove('text-black', 'font-black');
    }
    // 2. [추가] 브라우저 탭 타이틀 변경
    document.title = translations[lang]['web_title'] || 'OWLOG';
    // [3] 일반 텍스트 및 플레이스홀더 갱신
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.innerHTML = translations[lang][key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) el.placeholder = translations[lang][key];
    });

    // [4] 국가 리스트를 해당 언어로 다시 생성 (UserID/Region 이슈 해결)
    initRegionSelect(lang);

    // [5] 캐릭터 드롭다운도 갱신 (이미 분석된 결과가 있는 경우)
    const charSelect = document.getElementById('resName');
    if (charSelect && charSelect.value && charSelect.value !== "-") {
        if (typeof initHeroSelect === "function") await initHeroSelect(lang, charSelect.value);
    }

    // 검색 섹션이 열려있는 경우 내부 콘텐츠 재렌더링
    const sectionSearch = document.getElementById('section-search');
    if (sectionSearch && !sectionSearch.classList.contains('hidden')) {
        // 현재 활성화된 검색 탭 확인 후 재호출
        const isSummary = !document.getElementById('search-content-summary').classList.contains('hidden');
        switchSearchTab(isSummary ? 'summary' : 'records');
    }
}

/**
 * 국가 리스트 초기화 (코드만 표시 버전)
 */
function initRegionSelect(lang) {
    const regionSelect = document.getElementById('userRegion');
    if (!regionSelect) return;

    const currentVal = regionSelect.value; // 현재 선택값 유지
    regionSelect.innerHTML = '';

    // isoCodes 배열의 값을 대문자로 그대로 표시
    isoCodes.forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.text = code.toUpperCase(); // KR, US 등 코드만 표시
        regionSelect.add(option);
    });

    // 기타 옵션
    const etc = document.createElement('option');
    etc.value = "ETC";
    etc.text = "ETC";
    regionSelect.add(etc);

    // 선택값 복구
    if (currentVal) regionSelect.value = currentVal;
    else regionSelect.value = "US";
}

function openScanner() {
    document.getElementById('scannerModal').classList.remove('hidden');
}

function closeScanner() {
    document.getElementById('scannerModal').classList.add('hidden');
    document.getElementById('saveBtn').disabled = true;
    document.getElementById('userNickname').value = "";
    document.getElementById('resName').innerHTML = '<option value="">-</option>';
    document.getElementById('resTime').innerText = "-";
    document.getElementById('resEnemies').innerText = "-";
    document.getElementById('resLevel').innerText = "-";
    document.getElementById('resTotal').innerText = "0";
    document.getElementById('status').classList.remove('text-green-500');
}
/**
 * OWLOG - 데이터 저장 및 보안 로직
 */

const GAS_URL = "https://script.google.com/macros/s/AKfycbyd7db4FDEo5ca8NyABoYWoj4IM-qEzqJktKIqQeZB-ASHXZSOiVWp1zsEbrS-1wyYG/exec"; // 배포한 웹 앱 URL 입력

// [방어 레이어 1] 금지어 리스트 (핵심 키워드 위주로 구성, 로직으로 변형 차단)
const BANNED_KEYWORDS = [
    "admin", "운영자", "관리자", "owlog", "system", "root", "master",
    "씨발", "시발", "개새끼", "좆", "존나", "병신", "ㅄ", "ㅂㅅ", "ㅆㅂ", "ㅅㅂ",
    "fuck", "shit", "bitch", "nigger", "asshole", "trash",
    "노무현", "일베", "메갈", "워마드"
];

/**
 * [방어 레이어 2] 클라이언트 측 닉네임 검증 함수
 */
function validateNickname(name) {
    if (!name) return { ok: false, msg: "닉네임을 입력해주세요." };
    if (name.length > 15) return { ok: false, msg: "닉네임이 너무 깁니다. (최대 15자)" };

    // A. 특수문자 및 HTML 태그 방지 (한글, 영문, 숫자만 허용)
    const charRegex = /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]+$/;
    if (!charRegex.test(name)) {
        return { ok: false, msg: "닉네임에 특수문자나 HTML 태그를 사용할 수 없습니다." };
    }

    // B. 변형 욕설 및 금지어 체크 (공백/특수문자 제거 후 검사)
    const cleanName = name.replace(/[\s\.\-_]/g, "").toLowerCase();
    const hasBanned = BANNED_KEYWORDS.some(word => cleanName.includes(word));

    if (hasBanned) {
        return { ok: false, msg: "사용할 수 없는 단어가 포함되어 있습니다." };
    }

    // C. 도배성 문자 방지 (같은 글자 4번 반복 금지)
    const repeatRegex = /(.)\1{3,}/;
    if (repeatRegex.test(name)) {
        return { ok: false, msg: "도배성 닉네임은 사용할 수 없습니다." };
    }

    return { ok: true };
}

/**
 * [실제 저장 실행 함수]
 */
async function saveRecord() {
    const lang = localStorage.getItem('owlog_lang') || 'en';
    const saveBtn = document.getElementById('saveBtn');

    // 데이터 수집
    const nickname = document.getElementById('userNickname').value.trim();
    const region = document.getElementById('userRegion').value;
    const charName = document.getElementById('resName').value;
    const totalScore = document.getElementById('resTotal').innerText.replace(/,/g, '');

    // 1. 닉네임 보안 검증 실행
    const validation = validateNickname(nickname);
    if (!validation.ok) {
        alert(lang === 'ko' ? validation.msg : "Invalid Nickname.");
        return;
    }

    // 2. 스캔 여부 확인
    if (!charName || charName === "-") {
        alert(lang === 'ko' ? "데이터를 먼저 스캔해주세요." : "Please scan data first.");
        return;
    }

    // 3. UI 상태 변경 (중복 클릭 방지)
    saveBtn.disabled = true;
    const originalText = saveBtn.innerText;
    saveBtn.innerText = lang === 'ko' ? "전송 중..." : "SENDING...";

    const payload = {
        userId: nickname,
        region: region,
        character: charName,
        time: `'${document.getElementById('resTime').innerText}`,
        level: document.getElementById('resLevel').innerText,
        totalScore: totalScore
    };

    try {
        // 4. 구글 스프레드시트로 전송
        // fetch는 기본적으로 POST 시 CORS 이슈가 있을 수 있어 
        // GAS 배포 시 'Anyone'으로 설정해야 정상 작동합니다.
        const response = await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', // GAS 응답을 직접 읽지 못해도 전송은 가능하게 설정
            body: JSON.stringify(payload)
        });

        // no-cors 모드에서는 응답 내용을 읽을 수 없으므로 성공으로 간주하고 처리
        alert(lang === 'ko' ? "기록이 성공적으로 저장되었습니다!" : "Record saved successfully!");
        closeScanner();

    } catch (error) {
       // console.error("Save Error:", error);
        //alert(lang === 'ko' ? "서버 통신 에러가 발생했습니다." : "Server error occurred.");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = originalText;
    }
}


// [수정] 리스너를 하나로 통합하여 순서 제어
document.addEventListener('DOMContentLoaded', async () => {
    await loadLang();       // 언어 설정 먼저 완료
    initRegionSelect();     // 지역 선택 초기화
    await loadRanking();    // 그 다음 랭킹 로드 (딱 한 번만 실행)
});
/**
 * 홈 섹션 내부 서브 탭 전환 (Ranking <-> Guide)
 */
function switchTab(tab) {
    const sectionHome = document.getElementById('section-home');
    const sectionRank = document.getElementById('section-ranking');
    const sectionGuide = document.getElementById('section-guide');
    const sectionSearch = document.getElementById('section-search'); // 추가

    const navs = {
        home: document.getElementById('nav-home'),
        rank: document.getElementById('nav-rank'),
        guide: document.getElementById('nav-guide')
    };

    // 모든 섹션 숨기기 & 아이콘 초기화
    [sectionHome, sectionRank, sectionGuide, sectionSearch].forEach(el => el?.classList.add('hidden'));
    Object.values(navs).forEach(el => {
        if (el) { el.classList.remove('text-black'); el.classList.add('text-gray-300'); }
    });

    if (tab === 'ranking') {
        sectionRank.classList.remove('hidden');
        if (navs.rank) navs.rank.classList.replace('text-gray-300', 'text-black');
        loadMainRanking();
        initDetailedRankPage();

    }
    if (tab === 'guide') {
        sectionGuide.classList.remove('hidden');
        if (navs.guide) navs.guide.classList.replace('text-gray-300', 'text-black');
    }
    if (tab === 'home') {
        sectionHome.classList.remove('hidden');
        navs.home.classList.replace('text-gray-300', 'text-black');
        switchHomeTab('ranking');
    } else if (tab === 'search') {
        // 검색 결과 탭 활성화 (검색은 하단 nav가 없으므로 아이콘 활성화 생략)
        sectionSearch.classList.remove('hidden');
        if (rankingTimeout) { clearTimeout(rankingTimeout); rankingTimeout = null; }
    } else {
        // 홈이 아닌 탭 공통 로직
        if (rankingTimeout) { clearTimeout(rankingTimeout); rankingTimeout = null; }

    }
    window.scrollTo(0, 0);
}

/**
 * 홈 섹션 내부 탭 전환 로직
 * @param {string} tab - 'ranking' 또는 'guide'
 */
/**
 * 홈 섹션 내부 탭 전환 (강제 스타일 제어 버전)
 */
function switchHomeTab(tab) {
    const rankArea = document.getElementById('content-ranking');
    const guideArea = document.getElementById('content-guide');
    const btnRank = document.getElementById('home-tab-ranking');
    const btnGuide = document.getElementById('home-tab-guide');

    // 디버깅용: 콘솔에서 요소가 잡히는지 확인 (F12 눌러서 확인 가능)
    if (!rankArea || !guideArea) {
        console.error("ID를 찾을 수 없습니다: content-ranking 또는 content-guide");
        return;
    }

    if (tab === 'ranking') {
        // [랭킹 보기]
        // 인라인 스타일로 강제 노출 (기존 grid 레이아웃 유지)
        rankArea.style.setProperty('display', 'grid', 'important');
        guideArea.style.setProperty('display', 'none', 'important');

        // 버튼 스타일 업데이트
        btnRank.className = "flex-1 py-4 text-center text-[13px] md:text-sm tab-active transition-all";
        btnGuide.className = "flex-1 py-4 text-center text-[13px] md:text-sm text-gray-400 font-medium transition-all";

        if (typeof startRankingTimer === 'function') startRankingTimer();
    }
    else if (tab === 'guide') {
        // [가이드 보기]
        // 인라인 스타일로 강제 숨김
        rankArea.style.setProperty('display', 'none', 'important');
        // 가이드 영역 노출 (블록 형태)
        guideArea.style.setProperty('display', 'block', 'important');

        // 버튼 스타일 업데이트
        btnGuide.className = "flex-1 py-4 text-center text-[13px] md:text-sm tab-active transition-all";
        btnRank.className = "flex-1 py-4 text-center text-[13px] md:text-sm text-gray-400 font-medium transition-all";

        if (rankingTimeout) {
            clearTimeout(rankingTimeout);
            rankingTimeout = null;
        }
    }
}
/**
 * OWLOG - 반응형 랭킹 순환 변수
 */
let rankingDataCache = [];
let heroDataCache = null;
let currentRankingPage = 0;
let rankingTimeout = null;

/**
 * 기기 너비에 따른 표시 개수 결정
 */
function getItemsPerPage() {
    // md 브레이크포인트(768px) 이상이면 10개, 아니면 5개
    return window.innerWidth >= 768 ? 10 : 5;
}

/**
 * 랭킹 데이터를 슬라이드 단위로 렌더링 (반응형)
 */
function renderRankingSlide() {
    const lang = localStorage.getItem('owlog_lang') || 'en';
    const container = document.getElementById('content-ranking');
    if (!container || !rankingDataCache.length || !heroDataCache) return;

    const itemsPerPage = getItemsPerPage(); // 현재 화면 크기에 따른 개수 (5 또는 10)
    const startIndex = currentRankingPage * itemsPerPage;
    const slideData = rankingDataCache.slice(startIndex, startIndex + itemsPerPage);

    // 더 이상 보여줄 데이터가 없으면 1위로 리셋
    if (slideData.length === 0 || startIndex >= 15) {
        currentRankingPage = 0;
        renderRankingSlide();
        return;
    }

    container.innerHTML = '';

    slideData.forEach((item, index) => {
        const rank = startIndex + index + 1;
        const heroInfo = heroDataCache.characters.find(c =>
            c.english_name === item.character || c.korean_name === item.character
        );

        const regionCode = item.region.toLowerCase(); // 국가 코드를 소문자로 변환
        const flagUrl = `https://flagcdn.com/w40/${regionCode}.png`; // 40px 너비의 국기 이미지 URL

        let englishName = heroInfo ? heroInfo.english_name : item.character;
        let fileName = englishName.replace(/\s+/g, '_');
        const imgPath = `./heroes/${fileName}.webp`;
        const displayName = heroInfo ? (lang === 'ko' ? heroInfo.korean_name : heroInfo.english_name) : item.character;

        let objectPosition = "center 10%";
        let imageScale = "scale(1.3)"; // 기본 크기 (1배)

        if (englishName === "Alessia") objectPosition = "center 40%";
        if (englishName === "Yoiko") {
            objectPosition = "center 10%"; // 세로 위치만 고정
            imageScale = "scale(1.8) translateX(-5px)";
        } else if (englishName === "Alasdair") {
            objectPosition = "center 20%"; // 세로 위치만 고정
            imageScale = "scale(1.3)";
        } else if (englishName === "Ginzo") {
            objectPosition = "center 30%"; // 세로 위치만 고정
            imageScale = "scale(1.3)  translateX(3px)";
        } else if (englishName === "Akaisha") {
            objectPosition = "center 20%"; // 세로 위치만 고정
            imageScale = "scale(1.3)";
        } else if (englishName === "Alessia") {
            objectPosition = "center 40%"; // 세로 위치만 고정
            imageScale = "scale(1)";
        } else if (englishName === "Adelvyn") {
            objectPosition = "center 40%"; // 세로 위치만 고정
            imageScale = "scale(1)";
        } else if (englishName === "Kelara") {
            objectPosition = "center 30%"; // 세로 위치만 고정
            imageScale = "scale(1.2)";
        } else if (englishName === "Vesper") {
            objectPosition = "center 30%"; // 세로 위치만 고정
            imageScale = "scale(1.7)";
        } else if (englishName === "Jadetalon") {
            objectPosition = "center -20%"; // 세로 위치만 고정
            imageScale = "scale(2) translateX(10px)";
        }


        const card = document.createElement('div');
        // md:p-4 이상으로 PC에서 카드 크기도 살짝 키움
        card.className = "flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-all duration-500 opacity-0 transform translate-y-2";

        card.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="font-black ${rank <= 3 ? 'text-yellow-500' : 'text-gray-300'} w-4 text-center italic text-xs md:text-sm">${rank}</span>
                <div class="w-12 h-5 md:w-16 md:h-7 rounded bg-gray-200 border border-gray-200 overflow-hidden flex-shrink-0 relative">
                    <img src="${imgPath}" onerror="this.src='https://via.placeholder.com/48x20?text=Hero'" 
                             class="w-full h-full object-cover transition-transform" 
                 style="object-position: ${objectPosition}; transform: ${imageScale};">
                    <span class="absolute right-0 bottom-0 bg-red-500 text-[6px] md:text-[8px] text-white px-0.5 font-bold">Lv.${item.level}</span>
                </div>
                <div class="flex flex-col">
                    <div class="flex items-center gap-1.5">
                    <div class="w-5 h-3.5 md:w-6 md:h-4 overflow-hidden rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.1)] border border-gray-100 flex-shrink-0 bg-gray-50">
            <img src="${flagUrl}" 
                 onerror="this.src='https://via.placeholder.com/20x14?text=?'" 
                 class="w-full h-full object-cover shadow-inner" 
                 title="${item.region}">
        </div>
                        <span class="font-bold text-sm md:text-base leading-none text-gray-800">${item.userId}</span>
                    </div>
                    <span class="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase mt-0.5">${displayName}</span>
                </div>
            </div>
            <div class="flex flex-col items-end gap-1">
                <span class="text-[10px] md:text-xs font-bold text-gray-400 italic px-2 py-0.5 bg-white rounded shadow-sm">${item.time}</span>
                <span class="text-[9px] md:text-sm font-black text-gray-900 tracking-tighter">${Number(item.totalScore).toLocaleString()} PTS</span>
            </div>
        `;
        container.appendChild(card);
        setTimeout(() => card.classList.remove('opacity-0', 'translate-y-2'), index * 50);
    });

    // 다음 페이지 계산
    const isFirstPage = (currentRankingPage === 0);
    currentRankingPage++;

    // 1~5위(혹은 PC 1~10위) 포함된 첫 슬라이드는 20초, 나머지는 10초
    const delay = isFirstPage ? 20000 : 10000;

    if (rankingTimeout) clearTimeout(rankingTimeout);
    rankingTimeout = setTimeout(renderRankingSlide, delay);
}

/**
 * 윈도우 크기 조절 시 즉시 반영 (디바운싱 적용 권장이나 여기선 즉시 갱신)
 */
window.addEventListener('resize', () => {
    if (document.getElementById('section-home')?.classList.contains('hidden')) return;
    startRankingRotation();
});
/**
 * 순환 시작 함수
 */
function startRankingRotation() {
    if (rankingTimeout) clearTimeout(rankingTimeout);
    currentRankingPage = 0;
    renderRankingSlide(); // 첫 실행 (이 안에서 setTimeout으로 다음 루프가 예약됨)
}/**
 * OWLOG - 실시간 랭킹 로드 (레벨 -> 점수 -> 시간 순 정렬)
 */
async function loadRanking() {
    const container = document.getElementById('content-ranking');
    if (!container) return;

    try {
        const [rankingRes, heroRes] = await Promise.all([
            fetch(GAS_URL),
            fetch('json/hero.json')
        ]);

        let rawData = await rankingRes.json();
        heroDataCache = await heroRes.json();

        if (!rawData || rawData.length === 0) {
            container.innerHTML = `<p class="text-center py-10 text-gray-400 text-xs">No records found.</p>`;
            return;
        }

        // [핵심 수정] 다중 정렬 로직 적용
        rankingDataCache = rawData.sort((a, b) => {
            // 1순위: 고통 레벨 (내림차순 - 숫자가 클수록 위로)
            const levelA = Number(a.level) || 0;
            const levelB = Number(b.level) || 0;
            if (levelB !== levelA) {
                return levelB - levelA;
            }

            // 2순위: 합계 점수 (내림차순 - 점수가 높을수록 위로)
            const scoreA = Number(a.totalScore) || 0;
            const scoreB = Number(b.totalScore) || 0;
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }

            // 3순위: 시간 (오름차순 - 시간이 짧을수록 위로)
            // '00:27:45' 형식끼리 비교하므로 localeCompare가 정확합니다.
            return a.time.localeCompare(b.time);
        });

        // 정렬된 데이터로 로테이션 시작
        startRankingRotation();
    } catch (error) {
        console.error("Ranking Load Error:", error);
    }
}

/**
 * 상세 랭킹 전용 상태 변수
 */
let detailedRankData = [];      // 필터링된 결과 저장용
let detailedCurrentPage = 1;    // 현재 페이지
const detailedItemsPerPage = 16; // 페이지당 표시 개수

/**
 * 상세 랭킹 페이지 초기화
 */
async function initDetailedRankPage() {
    const heroSelect = document.getElementById('detailed-filter-hero');
    const levelSelect = document.getElementById('detailed-filter-level');
    const regionSelect = document.getElementById('detailed-filter-region'); // 국가 필터 요소
    const lang = localStorage.getItem('owlog_lang') || 'en';

    // 데이터 로드 대기 (생략 - 기존 로직 유지)
    if (!rankingDataCache || rankingDataCache.length === 0 || !heroDataCache) {
        setTimeout(initDetailedRankPage, 500);
        return;
    }

    // 1. 캐릭터 필터 옵션 (기존 로직 유지)
    const currentHero = heroSelect.value;
    heroSelect.innerHTML = `<option value="">${translations[lang]['filter_all_heroes'] || 'All Heroes'}</option>`;
    heroDataCache.characters.forEach(hero => {
        const opt = document.createElement('option');
        opt.value = hero.english_name;
        opt.text = lang === 'ko' ? hero.korean_name : hero.english_name;
        heroSelect.add(opt);
    });
    heroSelect.value = currentHero;

    // 2. 레벨 필터 옵션 (번역 적용)
    const currentLevel = levelSelect.value;
    const levelLabel = translations[lang]['label_level'] || 'Anguish';
    levelSelect.innerHTML = `<option value="">${translations[lang]['filter_all_levels'] || 'All Levels'}</option>`;
    for (let i = 16; i >= 1; i--) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.text = `${levelLabel} ${i}`;
        levelSelect.add(opt);
    }
    levelSelect.value = currentLevel;

    // 3. 국가 필터 옵션 (isoCodes 변수 참고)
    const currentRegion = regionSelect.value;
    // translations[lang]['label_region']이 "All Regions" 또는 "국가 선택" 등으로 표시되도록 함
    regionSelect.innerHTML = `<option value="">${translations[lang]['label_region'] || 'All Regions'}</option>`;

    // 전역 변수 isoCodes를 사용하여 옵션 생성
    isoCodes.forEach(code => {
        const opt = document.createElement('option');
        opt.value = code;
        opt.text = code.toUpperCase();
        regionSelect.add(opt);
    });
    regionSelect.value = currentRegion;

    handleRankFilterChange();
}

/**
 * 필터 변경 핸들러
 */
function handleRankFilterChange() {
    const heroVal = document.getElementById('detailed-filter-hero').value;
    const levelVal = document.getElementById('detailed-filter-level').value;
    const regionVal = document.getElementById('detailed-filter-region').value; // 국가 선택값

    const selectedHeroInfo = heroDataCache ? heroDataCache.characters.find(c => c.english_name === heroVal) : null;

    detailedRankData = rankingDataCache.filter(item => {
        // 영웅 체크
        let matchHero = true;
        if (heroVal && selectedHeroInfo) {
            matchHero = (item.character === selectedHeroInfo.english_name || item.character === selectedHeroInfo.korean_name);
        }
        // 레벨 체크
        const matchLevel = !levelVal || String(item.level) === levelVal;
        // 국가 체크
        const matchRegion = !regionVal || item.region === regionVal;

        return matchHero && matchLevel && matchRegion;
    });

    detailedCurrentPage = 1;
    renderDetailedRankList();
}
/**
 * 3. 리스트 렌더링 (15개씩 페이징)
 */
function renderDetailedRankList() {
    const listContainer = document.getElementById('detailed-rank-list');
    const lang = localStorage.getItem('owlog_lang') || 'en';
    if (!listContainer) return;

    listContainer.innerHTML = '';

    const start = (detailedCurrentPage - 1) * detailedItemsPerPage;
    const end = start + detailedItemsPerPage;
    const pagedData = detailedRankData.slice(start, end);

    if (pagedData.length === 0) {
        listContainer.innerHTML = `<div class="md:col-span-2 py-20 text-center text-gray-300 text-xs font-bold uppercase">No results match your filters</div>`;
        document.getElementById('detailed-rank-pagination').innerHTML = '';
        return;
    }

    pagedData.forEach((item, index) => {
        const globalRank = start + index + 1;
        const card = createDetailedRankCard(item, globalRank, lang);
        listContainer.appendChild(card);
    });

    renderDetailedPagination();
}

/**
 * 4. 상세 랭킹 전용 카드 생성 (국기/캐릭터 구도 포함)
 */
function createDetailedRankCard(item, rank, lang) {
    const heroInfo = heroDataCache.characters.find(c => c.english_name === item.character || c.korean_name === item.character);
    const englishName = heroInfo ? heroInfo.english_name : item.character;
    const displayName = heroInfo ? (lang === 'ko' ? heroInfo.korean_name : heroInfo.english_name) : item.character;
    const regionCode = (item.region || 'us').toLowerCase();
    const fileName = englishName.replace(/\s+/g, '_');

    // 캐릭터별 커스텀 구도
    let objPos = "center 20%";
    let transform = "scale(1)";
    if (englishName === "Yoiko") { objPos = "center 10%"; transform = "scale(1.8) translateX(-10px)"; }
    if (englishName === "Huo Yufeng") { objPos = "center 10%"; transform = "scale(1.5) translateX(5px)"; }
    if (englishName === "Alessia") { objPos = "center 40%"; }
    if (englishName === "Vesper") { objPos = "center 30%"; transform = "scale(1.5) translateX(5px)"; }
    if (englishName === "Jadetalon") { objPos = "center 10%"; transform = "scale(2) translateX(15px) translateY(5px)"; }
    if (englishName === "Hua Ling") { objPos = "center 10%"; transform = "scale(1.5) translateX(2px) translateY(5px)"; }
    if (englishName === "Zilan") { objPos = "center 30%"; transform = ""; }
    if (englishName === "Synthia") { objPos = "center 20%"; transform = "scale(1.5) translateX(-15px)"; }
    if (englishName === "Anibella") { objPos = "center 10%"; transform = "scale(1.5)"; }


    const card = document.createElement('div');
    card.className = "flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 opacity-0 transform translate-y-2";

    card.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="font-black ${rank <= 3 ? 'text-yellow-500' : 'text-gray-300'} w-6 text-center italic text-base">${rank}</span>
            <div class="w-5 h-3.5 overflow-hidden rounded-[2px] shadow-sm border border-gray-100 flex-shrink-0 bg-white">
                <img src="https://flagcdn.com/w40/${regionCode}.png" class="w-full h-full object-cover">
            </div>
            <div class="w-14 h-6 md:w-20 md:h-8 rounded-lg bg-gray-200 overflow-hidden relative flex-shrink-0">
                <img src="./heroes/${fileName}.webp" onerror="this.src='https://via.placeholder.com/80x32?text=Hero'" 
                     class="w-full h-full object-cover" style="object-position: ${objPos}; transform: ${transform};">
                <span class="absolute right-0 bottom-0 bg-red-500 text-[8px] text-white px-1 font-bold">Lv.${item.level}</span>
            </div>
            <div class="flex flex-col">
                <span class="font-bold text-sm md:text-base text-gray-800 leading-none">${item.userId}</span>
                <span class="text-[10px] font-bold text-gray-400 uppercase mt-1">${displayName}</span>
            </div>
        </div>
        <div class="text-right">
            <span class="text-[10px] font-bold text-gray-400 block mb-0.5">${item.time}</span>
            <span class="text-base font-black text-gray-900">${Number(item.totalScore).toLocaleString()}</span>
        </div>
    `;

    setTimeout(() => card.classList.remove('opacity-0', 'translate-y-2'), 50);
    return card;
}

/**
 * 5. 상세 페이징 버튼 생성
 */
function renderDetailedPagination() {
    const paginContainer = document.getElementById('detailed-rank-pagination');
    if (!paginContainer) return;

    paginContainer.innerHTML = '';
    const totalPages = Math.ceil(detailedRankData.length / detailedItemsPerPage);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = `w-10 h-10 rounded-xl text-sm font-black transition-all ${detailedCurrentPage === i ? 'bg-black text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`;
        btn.onclick = () => {
            detailedCurrentPage = i;
            renderDetailedRankList();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        paginContainer.appendChild(btn);
    }
}


/**
 * 검색 관련 전역 상태
 */
let currentUserRecords = [];

// 검색창 엔터키 이벤트 리스너 (DOMContentLoaded 내부에 추가)
document.querySelector('[data-i18n-placeholder="placeholder_search"]').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        performUserSearch(this.value.trim());
    }
});

/**
 * 2. 검색 프로필 헤더 갱신
 */
function updateSearchProfile(userId) {
    const lang = localStorage.getItem('owlog_lang') || 'en';
    const firstItem = currentUserRecords[0]; // 가장 최근 기록 기반 (정렬된 상태 가정)

    // 캐릭터별 플레이 횟수 계산하여 가장 많이 쓴 캐릭터 찾기
    const charCounts = {};
    currentUserRecords.forEach(r => charCounts[r.character] = (charCounts[r.character] || 0) + 1);
    const mostPlayedChar = Object.keys(charCounts).reduce((a, b) => charCounts[a] > charCounts[b] ? a : b);

    // 캐릭터 정보 찾기 (이미지용)
    const heroInfo = heroDataCache.characters.find(c => c.english_name === mostPlayedChar || c.korean_name === mostPlayedChar);
    const fileName = heroInfo ? heroInfo.english_name.replace(/\s+/g, '_') : 'Hero';

    // 텍스트 및 이미지 주입
    document.getElementById('search-user-id').innerText = userId;
    document.getElementById('search-user-region').innerText = firstItem.region;
    document.getElementById('search-last-update').innerText = `Last updated: ${firstItem.time || '---'}`;
    document.getElementById('search-total-play').innerText = `${currentUserRecords.length} PLAYS`;

    document.getElementById('search-user-flag').innerHTML = `
        <img src="https://flagcdn.com/w40/${firstItem.region.toLowerCase()}.png" class="w-full h-full object-cover">
    `;

    document.getElementById('search-profile-img').innerHTML = `
        <img src="./heroes/${fileName}.webp" class="w-full h-full object-cover" style="object-position: center 20%; transform: scale(1.2);">
    `;
}

/**
 * 4. 기록 탭 렌더링 (전체 기록 나열)
 */
function renderSearchRecords() {
    const container = document.getElementById('search-content-records');
    const lang = localStorage.getItem('owlog_lang') || 'en';
    container.innerHTML = '';

    currentUserRecords.forEach((item, index) => {
        // 기존 랭킹 카드 생성 함수(createDetailedRankCard)를 재사용하거나 유사하게 생성
        const card = createDetailedRankCard(item, index + 1, lang);
        container.appendChild(card);
    });
}

/**
 * 5. 캐릭터 요약 탭 렌더링 (통계)
 */
function renderSearchSummary() {
    const container = document.getElementById('search-content-summary');
    const lang = localStorage.getItem('owlog_lang') || 'en';
    container.innerHTML = '';

    // 캐릭터별 통계 계산
    const stats = {};
    currentUserRecords.forEach(item => {
        if (!stats[item.character]) {
            stats[item.character] = { count: 0, totalScore: 0, maxScore: 0, level: item.level };
        }
        const score = Number(item.totalScore);
        stats[item.character].count++;
        stats[item.character].totalScore += score;
        if (score > stats[item.character].maxScore) stats[item.character].maxScore = score;
    });

    Object.keys(stats).forEach(charName => {
        const s = stats[charName];
        const avgScore = Math.round(s.totalScore / s.count);
        const heroInfo = heroDataCache.characters.find(c => c.english_name === charName || c.korean_name === charName);
        const displayName = heroInfo ? (lang === 'ko' ? heroInfo.korean_name : heroInfo.english_name) : charName;

        const row = document.createElement('div');
        row.className = "bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm";
        row.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden">
                    <img src="./heroes/${charName.replace(/\s+/g, '_')}.webp" class="w-full h-full object-cover">
                </div>
                <div>
                    <p class="font-black text-sm text-gray-800">${displayName}</p>
                    <p class="text-[10px] font-bold text-gray-400 uppercase">${s.count} GAMES PLAYED</p>
                </div>
            </div>
            <div class="flex gap-6 text-right">
                <div>
                    <p class="text-[9px] font-bold text-gray-400 uppercase">Best</p>
                    <p class="text-xs font-black text-blue-600">${s.maxScore.toLocaleString()}</p>
                </div>
                <div>
                    <p class="text-[9px] font-bold text-gray-400 uppercase">Avg</p>
                    <p class="text-xs font-black text-gray-800">${avgScore.toLocaleString()}</p>
                </div>
            </div>
        `;
        container.appendChild(row);
    });
}

function performUserSearch(query) {
    if (!query) return;
    const lang = localStorage.getItem('owlog_lang') || 'en';

    // 데이터 필터링 (대소문자 구분 없음)
    const userRecords = rankingDataCache.filter(item =>
        item.userId.toLowerCase() === query.toLowerCase()
    );

    if (userRecords.length === 0) {
        alert(lang === 'ko' ? "등록된 기록이 없는 유저입니다." : "No records found for this user.");
        return;
    }

    // [핵심] 데이터 바인딩 전 로딩 뷰 숨기고 결과 뷰 보여주기
    document.getElementById('search-loading-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.remove('hidden');

    // 전역 참조 변수에 데이터 저장 (정렬되지 않은 원본 순서 유지)
    searchUserRecordsRef = [...userRecords];

    // 섹션 전환
    switchTab('search');

    // 가장 많이 사용한 캐릭터 계산
    const charCounts = {};
    userRecords.forEach(r => charCounts[r.character] = (charCounts[r.character] || 0) + 1);
    const mostPlayedChar = Object.keys(charCounts).reduce((a, b) => charCounts[a] > charCounts[b] ? a : b);
    const heroInfo = heroDataCache.characters.find(c => c.english_name === mostPlayedChar || c.korean_name === mostPlayedChar);
    const fileName = heroInfo ? heroInfo.english_name.replace(/\s+/g, '_') : 'Hero';

    // 최신 시간 (G열) 가져오기
    const latestRecord = userRecords[userRecords.length - 1];

    // 프로필 UI 업데이트
    document.getElementById('search-user-id').innerText = query;
    document.getElementById('search-user-region').innerText = latestRecord.region;
    document.getElementById('search-total-play').innerText = userRecords.length;
    document.getElementById('search-last-update').innerText = latestRecord.time; // 시트의 실제 시간

    document.getElementById('search-user-flag').innerHTML = `
        <img src="https://flagcdn.com/w40/${latestRecord.region.toLowerCase()}.png" class="w-full h-full object-cover">
    `;
    document.getElementById('search-profile-img').innerHTML = `
        <img src="./heroes/${fileName}.webp" class="w-full h-full object-cover" style="transform: scale(1.4); object-position: center 10%;">
    `;

    // 기본 탭인 '기록' 표시 실행
    switchSearchTab('records');
}
let searchCurrentPage = 1;
const searchItemsPerPage = 10;

/**
 * 1. 검색 탭 전환 로직 수정
 */
function switchSearchTab(type) {
    const recCont = document.getElementById('search-content-records');
    const sumCont = document.getElementById('search-content-summary');
    const paginCont = document.getElementById('search-pagination'); // 페이징 컨테이너
    const recBtn = document.getElementById('search-tab-records');
    const sumBtn = document.getElementById('search-tab-summary');
    const lang = localStorage.getItem('owlog_lang') || 'en';

    if (!recCont || !sumCont || !paginCont) return;

    if (type === 'records') {
        recCont.classList.remove('hidden');
        paginCont.classList.remove('hidden'); // 페이징 표시
        sumCont.classList.add('hidden');

        recBtn.className = "flex-1 py-4 text-center text-[13px] md:text-sm tab-active transition-all";
        sumBtn.className = "flex-1 py-4 text-center text-[13px] md:text-sm text-gray-400 font-medium transition-all";

        // 페이지 초기화 및 렌더링
        searchCurrentPage = 1;
        renderSearchRecordsPage();
    } else {
        sumCont.classList.remove('hidden');
        recCont.classList.add('hidden');
        paginCont.classList.add('hidden'); // 요약 탭에서는 페이징 숨김

        sumBtn.className = "flex-1 py-4 text-center text-[13px] md:text-sm tab-active transition-all";
        recBtn.className = "flex-1 py-4 text-center text-[13px] md:text-sm text-gray-400 font-medium transition-all";

        renderSummaryStats(sumCont, lang);
    }
}
/**
 * 검색 결과 탭 콘텐츠 렌더링
 */
let searchUserRecordsRef = []; // 참조 저장용
function renderSearchContent(records) {
    searchUserRecordsRef = records;
}

/**
 * 캐릭터 요약 통계 출력 (다국어 라벨 적용)
 */
function renderSummaryStats(container, lang) {
    const stats = {};
    searchUserRecordsRef.forEach(item => {
        if (!stats[item.character]) stats[item.character] = { count: 0, max: 0, total: 0 };
        const score = Number(item.totalScore);
        stats[item.character].count++;
        stats[item.character].total += score;
        if (score > stats[item.character].max) stats[item.character].max = score;
    });

    container.innerHTML = '';

    // idle.json에서 라벨 가져오기 (기본값 설정)
    const labelGames = lang === 'ko' ? '판 플레이' : 'GAMES';
    const labelBest = translations[lang]['label_best'] || 'Best';
    const labelAvg = translations[lang]['label_avg'] || 'Average';

    Object.keys(stats).forEach(charName => {
        const s = stats[charName];
        const heroInfo = heroDataCache.characters.find(c => c.english_name === charName || c.korean_name === charName);
        const displayName = heroInfo ? (lang === 'ko' ? heroInfo.korean_name : heroInfo.english_name) : charName;
        const fileName = (heroInfo ? heroInfo.english_name : charName).replace(/\s+/g, '_');

        const row = document.createElement('div');
        row.className = "bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm";
        row.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-xl bg-white border border-gray-100 overflow-hidden flex-shrink-0 relative">
                    <img src="./heroes/${fileName}.webp" class="w-full h-full object-cover">
                </div>
                <div>
                    <p class="font-black text-sm text-gray-800">${displayName}</p>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tight">${s.count} ${labelGames}</p>
                </div>
            </div>
            <div class="flex gap-6 md:gap-10 text-right">
                <div>
                    <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">${labelBest}</p>
                    <p class="text-sm font-black text-blue-500">${s.max.toLocaleString()}</p>
                </div>
                <div>
                    <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">${labelAvg}</p>
                    <p class="text-sm font-black text-gray-900">${Math.round(s.total / s.count).toLocaleString()}</p>
                </div>
            </div>
        `;
        container.appendChild(row);
    });
}

/**
 * 1. 특정 유저 페이지로 즉시 점프 (로딩 뷰 노출)
 */
function handleDirectJump(userId) {
    // 즉시 검색 섹션 활성화 (이때 index.html에 설정된 loading-view가 기본으로 보임)
    switchTab('search');

    // 로딩 상태 강제 리셋 (결과 뷰 숨기고 로딩 뷰 보여주기)
    document.getElementById('search-loading-view').classList.remove('hidden');
    document.getElementById('search-results-view').classList.add('hidden');

    const syncCheck = setInterval(() => {
        if (typeof rankingDataCache !== 'undefined' && rankingDataCache.length > 0 && typeof heroDataCache !== 'undefined') {
            clearInterval(syncCheck);
            performUserSearch(userId); // 데이터 준비 완료 시 호출
        }
    }, 300);
}


/**
 * 검색 결과 페이지 내 버튼 기능 활성화 (새로고침 & 공유)
 */
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('btn-refresh-data');
    const shareBtn = document.getElementById('btn-share-profile');

    // 1. 새로고침 버튼 클릭 시
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            const userId = document.getElementById('search-user-id').innerText;
            if (!userId || userId === '---') return;

            // 로딩 뷰로 전환 (애니메이션 노출)
            document.getElementById('search-loading-view').classList.remove('hidden');
            document.getElementById('search-results-view').classList.add('hidden');

            try {
                // 스프레드시트 데이터 다시 불러오기 (기존 loadRanking 함수 호출)
                await loadRanking();

                // 데이터 로드 완료 후 다시 검색 결과 반영
                performUserSearch(userId);
            } catch (error) {
                console.error("Data sync failed:", error);
                // 에러 시 다시 결과 화면은 보여줌
                document.getElementById('search-loading-view').classList.add('hidden');
                document.getElementById('search-results-view').classList.remove('hidden');
            }
        });
    }

    // 2. 공유 버튼 클릭 시
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const userId = document.getElementById('search-user-id').innerText;
            if (!userId || userId === '---') return;

            const lang = localStorage.getItem('owlog_lang') || 'en';

            // 공유용 URL 생성 (한글 닉네임 대응을 위해 encodeURIComponent 사용)
            const shareUrl = `https://owlog.xyz/?id=${encodeURIComponent(userId)}`;

            // 클립보드 복사 실행
            navigator.clipboard.writeText(shareUrl).then(() => {
                // 복사 완료 알림 (alert 대신 커스텀 토스트가 있다면 교체 가능)
                const msg = lang === 'ko'
                    ? "프로필 주소가 복사되었습니다!"
                    : "Profile link copied to clipboard!";
                alert(msg);
            }).catch(err => {
                console.error('Share failed:', err);
            });
        });
    }
});

function renderSearchRecordsPage() {
    const container = document.getElementById('search-content-records');
    const lang = localStorage.getItem('owlog_lang') || 'en';
    if (!container) return;

    // 데이터 슬라이싱 (15개씩)
    const start = (searchCurrentPage - 1) * searchItemsPerPage;
    const end = start + searchItemsPerPage;
    const pagedRecords = searchUserRecordsRef.slice(start, end);

    container.innerHTML = '';

    // 카드 렌더링
    pagedRecords.forEach((item, idx) => {
        const globalRank = start + idx + 1;
        const card = createDetailedRankCard(item, globalRank, lang);
        container.appendChild(card);
    });

    // 하단 페이징 버튼 생성
    renderSearchPagination();
}

/**
 * 3. 검색 기록 전용 페이징 버튼 생성
 */
function renderSearchPagination() {
    const paginContainer = document.getElementById('search-pagination');
    if (!paginContainer) return;

    paginContainer.innerHTML = '';
    const totalPages = Math.ceil(searchUserRecordsRef.length / searchItemsPerPage);

    // 1페이지뿐이라면 페이징 표시 안 함
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        // 디자인 통일: 상세 랭킹의 페이징 스타일과 동일하게 적용
        btn.className = `w-10 h-10 rounded-xl text-sm font-black transition-all ${searchCurrentPage === i
            ? 'bg-black text-white shadow-lg scale-110'
            : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-100'
            }`;

        btn.onclick = () => {
            searchCurrentPage = i;
            renderSearchRecordsPage();
            // 페이지 상단이 아닌 결과 탭 시작 부분으로 스크롤 이동
            document.getElementById('search-tab-records').scrollIntoView({ behavior: 'smooth' });
        };
        paginContainer.appendChild(btn);
    }
}


/**
 * 1. 버튼 클릭 시 숨겨진 파일 인풋 실행
 */
function triggerScanner() {
    const fileInput = document.getElementById('imageInput');
    if (fileInput) {
        fileInput.click();
    }
}


async function loadMainRanking() {
    const loader = document.getElementById('rank-main-loader');
    const content = document.getElementById('rank-main-content');

    // 1. 데이터 로드 시작: 로더 보이기, 컨텐츠 숨기기
    if (loader) loader.classList.remove('hidden');
    if (content) content.classList.add('hidden');

    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();

        // [정렬 로직] 레벨 -> 점수 순 (기존 로직 사용)
        const sortedData = data.sort((a, b) => {
            const lvA = parseInt(String(a.level || 0).replace(/[^0-9]/g, '')) || 0;
            const lvB = parseInt(String(b.level || 0).replace(/[^0-9]/g, '')) || 0;
            if (lvB !== lvA) return lvB - lvA;
            return (Number(b.totalScore) || 0) - (Number(a.totalScore) || 0);
        });

        // 2. 렌더링 실행
        if (typeof renderDetailedRankList === 'function') {
            renderDetailedRankList(sortedData);
        }

        // 3. 로딩 완료: 로더 숨기기, 컨텐츠 보이기
        if (loader) loader.classList.add('hidden');
        if (content) content.classList.remove('hidden');

    } catch (error) {
        console.error("Load Error:", error);
        if (loader) loader.innerHTML = `<p class="text-[10px] font-bold text-red-400">FAILED TO SYNC DATABASE</p>`;
    }
}