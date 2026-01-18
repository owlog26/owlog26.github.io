/**
 * OWLOG - script.js
 */
// [script.js 최상단]
let skHeroDataCache = null; // [추가] SK용 전역 변수

let currentModeTab = "Classic"; // 기본값 설정
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
    if (userId) {
        // 기존에 정의된 handleDirectJump 함수를 호출합니다.
        handleDirectJump(userId);
    }
    else if (urlParams.has('howtoregister')) {
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
    } else if (tab === 'sk_ranking') {
        // 1. 로딩 바(sk-loader) 노출
        const loader = document.getElementById('sk-loader');
        if (loader) {
            loader.style.setProperty('display', 'flex', 'important');
        }

        // 2. 컨테이너를 보여주되, 이전 데이터 잔상을 지우기 위해 비워둠
        const container = document.getElementById('content-sk-ranking');
        if (container) {
            container.classList.remove('hidden');
            // 로더를 제외한 기존 카드들만 제거하거나 전체를 비웁니다.
            // renderSKRankingSlide에서 내부를 비우므로 여기선 로더만 띄워도 무방합니다.
        }

        // 3. 데이터를 다시 로드하고 렌더링 실행
        // loadRanking() 내부에서 fetch가 완료된 후 renderSKRankingSlide()를 호출해야 합니다.
        if (typeof loadRanking === 'function') {
            loadRanking(); 
        } else {
            // 로딩 연출을 위해 직접 렌더링 함수 호출
            if (typeof renderSKRankingSlide === 'function') renderSKRankingSlide();
        }
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
    // 2. [추가] 스캐너 내 영웅 드롭다운 갱신 (scanner.js 함수 호출)
    if (typeof initHeroSelect === 'function') {
        const currentSelectedHero = document.getElementById('resName')?.value;
        await initHeroSelect(lang, currentSelectedHero);
    }

    // 3. [추가] 상세 랭킹 페이지 필터 갱신 (선택된 섹션이 랭킹일 때)
    const rankSection = document.getElementById('section-ranking');
    if (rankSection && !rankSection.classList.contains('hidden')) {
        await initDetailedRankPage(); // 여기서 히어로 필터가 한영에 맞게 다시 그려짐
    }

    // 4. [추가] 메인 화면 랭킹 슬라이드 즉시 갱신
    if (typeof renderRankingSlide === 'function') {
        renderRankingSlide();
    }
}

/**
 * [script.js] 국가 리스트 초기화 (국가명 표시 버전)
 */
function initRegionSelect(lang = 'en') {
    const regionSelect = document.getElementById('userRegion');
    if (!regionSelect) return;

    const currentVal = regionSelect.value;
    regionSelect.innerHTML = '';

    // 브라우저 내장 국가명 변환 도구 (설정된 언어 기준)
    const regionNames = new Intl.DisplayNames([lang], { type: 'region' });

    isoCodes.forEach(code => {
        const option = document.createElement('option');
        option.value = code;

        try {
            // KR -> "대한민국", US -> "미국" 등으로 변환
            option.text = regionNames.of(code);
        } catch (e) {
            option.text = code.toUpperCase(); // 변환 실패 시 코드 표시
        }

        regionSelect.add(option);
    });

    // 기타 옵션 추가
    const etc = document.createElement('option');
    etc.value = "ETC";
    etc.text = lang === 'ko' ? "기타" : "ETC";
    regionSelect.add(etc);

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

const GAS_URL = "https://script.google.com/macros/s/AKfycbz2wYdR971cUs88dX303p1vTNGMiZNitfCu3HaKGhBqt8iC5_ZzGkv6789o8Rx7gWQt/exec";


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
function renderRankingSlide() {
    const lang = localStorage.getItem('owlog_lang') || 'ko';
    const container = document.getElementById('content-ranking');

    // 필수 데이터 로드 여부 확인
    if (!container || !rankingDataCache.length || !heroDataCache || !translations[lang]) return;

    if (rankingTimeout) {
        clearTimeout(rankingTimeout);
        rankingTimeout = null;
    }

    // [1] 전체 데이터에서 유저별 최고 기록 추출
    const bestData = getBestRecordsPerUser(rankingDataCache);

    // [2] 필터링 강화: 공백 제거 및 대소문자 무시
    // 시트에서 "Classic " 처럼 공백이 들어가거나 "classic"으로 올 경우를 대비합니다.
    const classicTop5 = bestData.filter(item =>
        item.mode && item.mode.trim().toLowerCase() === 'classic'
    ).slice(0, 5);

    const riftTop5 = bestData.filter(item =>
        item.mode && item.mode.trim().toLowerCase() === 'rift'
    ).slice(0, 5);

    container.innerHTML = '';
    container.className = "mt-4 space-y-8 md:col-span-2";

    const renderSection = (title, data, modeLabel, sectionId) => {
        // 데이터가 없으면 섹션 자체를 그리지 않음
        if (data.length === 0) return;

        const section = document.createElement('div');
        section.className = "space-y-3";

        const header = document.createElement('div');
        header.className = "flex items-center justify-between px-1 mb-2";
        const barColorClass = sectionId === 'classic' ? 'bg-gray-700' : 'bg-gray-500';

        header.innerHTML = `
            <h3 class="font-bold text-sm md:text-base flex items-center gap-2 text-gray-800">
                <span class="w-1 h-4 rounded-sm ${barColorClass}"></span>
                ${title}
            </h3>
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top 6</span>
        `;
        section.appendChild(header);

        const listGrid = document.createElement('div');
        listGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-3";

        data.forEach((item, index) => {
            const rank = index + 1;
            const heroInfo = heroDataCache.characters.find(c =>
                c.english_name === item.character || c.korean_name === item.character
            );

            const regionCode = (item.region || 'us').toLowerCase();
            const flagUrl = `https://flagcdn.com/w40/${regionCode}.png`;
            const englishName = heroInfo ? heroInfo.english_name : item.character;
            const fileName = englishName.replace(/\s+/g, '_');
            const imgPath = `./heroes/${fileName}.webp`;
            const displayName = heroInfo ? (lang === 'ko' ? heroInfo.korean_name : heroInfo.english_name) : item.character;

            // 배지 및 라벨 설정
            const badgeLabel = sectionId === 'classic' ? (lang === 'ko' ? '단계' : 'STG') : (lang === 'ko' ? '고통' : 'Lv.');
            const badgeValue = sectionId === 'classic' ? (item.stage || "1") : (item.level || "0");

            let infoLabelText = "";
            if (sectionId === 'classic') {
                const levelText = lang === 'ko' ? '고통' : 'Lv.';
                infoLabelText = `${levelText} ${item.level} <span class="mx-0.5 text-gray-300">•</span> ${displayName}`;
            } else {
                infoLabelText = displayName;
            }

            let objectPosition = "center 10%";
            let imageScale = "scale(1.3)";
            if (englishName === "Alessia") objectPosition = "center 40%";
            if (englishName === "Yoiko") { objectPosition = "center 10%"; imageScale = "scale(1.8) translateX(-5px)"; }
            if (englishName === "Vesper") { objectPosition = "center 30%"; imageScale = "scale(1.7)"; }
            if (englishName === "Jadetalon") { objectPosition = "center -20%"; imageScale = "scale(2) translateX(10px)"; }
            if (englishName === "Adelvyn") { objectPosition = "center 30%"; imageScale = "scale(1.3) translateX(-10px)"; }
            if (englishName === "Peddler") { objectPosition = "center 10%"; imageScale = "scale(1)  translateX(10px)"; }

            const card = document.createElement('div');
            card.className = "flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-md";
            card.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="font-bold ${rank <= 3 ? 'text-gray-700' : 'text-gray-400'} w-4 text-center italic text-xs">${rank}</span>
                    <div class="w-12 h-5 md:w-16 md:h-7 rounded bg-gray-100 border border-gray-100 overflow-hidden flex-shrink-0 relative">
                        <img src="${imgPath}" onerror="this.src='https://via.placeholder.com/48x20?text=Hero'" 
                             class="w-full h-full object-cover grayscale-[30%]" style="object-position: ${objectPosition}; transform: ${imageScale};">
                        <span class="absolute right-0 bottom-0 bg-red-600/80 text-[6px] md:text-[8px] text-white px-1 font-bold">
                            ${badgeLabel} ${badgeValue}
                        </span>
                    </div>
                    <div class="flex flex-col">
                        <div class="flex items-center gap-1.5">
                            <img src="${flagUrl}" class="w-4 h-3 object-cover rounded-[1px] shadow-sm opacity-80">
                            <span class="font-bold text-sm text-gray-700 cursor-pointer hover:text-black transition-colors" onclick="handleDirectJump('${item.userId}')">${item.userId}</span>
                        </div>
                        <span class="text-[8px] font-medium text-gray-400 uppercase mt-0.5">${infoLabelText}</span>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-0.5">
                    <span class="text-[8px] font-medium text-gray-400 uppercase tracking-tighter">
                        ${Number(item.totalScore).toLocaleString()} PTS
                    </span>
                    <span class="text-[11px] font-bold text-gray-900 tabular-nums tracking-tight">
                        ${item.time}
                    </span>
                </div>
            `;
            listGrid.appendChild(card);
        });

        section.appendChild(listGrid);
        container.appendChild(section);
    };

    const titleClassic = translations[lang]['fissure'] || "Spatial Interstice";
    const labelClassic = translations[lang]['fissureSub'] || "Classic";
    const titleRift = translations[lang]['rift'] || "The Rift";
    const labelRift = translations[lang]['riftSub'] || "Rift";

    renderSection(titleClassic, classicTop5, labelClassic, 'classic');
    renderSection(titleRift, riftTop5, labelRift, 'rift');
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
    const sectionSearch = document.getElementById('section-search');

    const navs = {
        home: document.getElementById('nav-home'),
        rank: document.getElementById('nav-rank'),
        guide: document.getElementById('nav-guide')
    };

    // 상단 액션 버튼 가져오기
    const actionBtn = document.getElementById('header-action-btn');

    // 모든 섹션 숨기기 & 아이콘 초기화
    [sectionHome, sectionRank, sectionGuide, sectionSearch].forEach(el => el?.classList.add('hidden'));
    Object.values(navs).forEach(el => {
        if (el) { el.classList.remove('text-black'); el.classList.add('text-gray-300'); }
    });

    // --- 상단 버튼 동적 변경 로직 추가 ---
    if (actionBtn) {
        if (tab === 'search') {
            // 프로필 탭일 때: 뒤로가기 아이콘 및 홈 이동 기능
            actionBtn.onclick = () => goBackToHome();
            actionBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>`;
        } else {
            // 다른 탭일 때: 플러스 아이콘 및 스캐너 기능 복구
            actionBtn.onclick = () => openScanner();
            actionBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>`;
        }
    }
    // ------------------------------------

    if (tab === 'ranking') {
        sectionRank?.classList.remove('hidden');
        if (navs.rank) navs.rank.classList.replace('text-gray-300', 'text-black');
        loadMainRanking();
        initDetailedRankPage();
    }
    if (tab === 'guide') {
        sectionGuide?.classList.remove('hidden');
        if (navs.guide) navs.guide.classList.replace('text-gray-300', 'text-black');
    }
    if (tab === 'home') {
        sectionHome?.classList.remove('hidden');
        if (navs.home) navs.home.classList.replace('text-gray-300', 'text-black');
        switchHomeTab('ranking');
    } else if (tab === 'search') {
        sectionSearch?.classList.remove('hidden');
        if (rankingTimeout) { clearTimeout(rankingTimeout); rankingTimeout = null; }
    } else {
        if (rankingTimeout) { clearTimeout(rankingTimeout); rankingTimeout = null; }
    }
    window.scrollTo(0, 0);
}

/**
 * 홈 섹션 내부 탭 전환 로직
 * @param {string} tab - 'ranking' 또는 'guide'
 *//**
* 홈 섹션 내부 탭 전환 (OWL 랭킹 / SK 랭킹 / 가이드)
*/

function switchHomeTab(tab) {
    const areas = {
        ranking: document.getElementById('content-ranking'),
        sk_ranking: document.getElementById('content-sk-ranking'),
        guide: document.getElementById('content-guide')
    };
    const buttons = {
        ranking: document.getElementById('home-tab-ranking'),
        sk_ranking: document.getElementById('home-tab-sk-ranking'),
        guide: document.getElementById('home-tab-guide')
    };

    // 1. 모든 영역 숨기기 및 버튼 스타일 초기화
    Object.keys(areas).forEach(key => {
        if (areas[key]) {
            areas[key].style.setProperty('display', 'none', 'important');
        }
        if (buttons[key]) {
            buttons[key].className = "flex-1 py-4 text-center text-[13px] md:text-sm text-gray-400 font-medium transition-all";
        }
    });

    // 2. 선택된 탭 활성화
    if (areas[tab]) {
        // 가이드는 블록(block), 랭킹은 그리드(grid) 레이아웃 적용
        const displayType = (tab === 'guide') ? 'block' : 'grid';
        areas[tab].style.setProperty('display', displayType, 'important');
    }

    if (buttons[tab]) {
        buttons[tab].className = "flex-1 py-4 text-center text-[13px] md:text-sm tab-active transition-all";
    }

    // 3. 데이터 로드 및 타이머 제어
    if (tab === 'guide') {
        if (rankingTimeout) { clearTimeout(rankingTimeout); rankingTimeout = null; }
    } else if (tab === 'sk_ranking') {
        // 소울 나이트 전용 랭킹 렌더링 함수가 있다면 호출 (예: renderSKRankingSlide)
        if (typeof renderSKRankingSlide === 'function') renderSKRankingSlide();
    } else {
        if (typeof startRankingRotation === 'function') startRankingRotation();
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
 * OWLOG - OWL 메인 랭킹 슬라이드 렌더링
 * SK 로더가 겹치지 않도록 숨김 로직 추가
 */
function renderRankingSlide() {
    const lang = localStorage.getItem('owlog_lang') || 'ko';
    const container = document.getElementById('content-ranking');
    
    // [추가] OWL 랭킹 로드 시 SK 컨테이너와 로더를 강제로 숨김 처리
    const skContainer = document.getElementById('content-sk-ranking');
    if (skContainer) {
        skContainer.classList.add('hidden');
    }

    if (!container || !rankingDataCache.length || !heroDataCache || !translations[lang]) return;

    if (rankingTimeout) {
        clearTimeout(rankingTimeout);
        rankingTimeout = null;
    }

    const bestData = getBestRecordsPerUser(rankingDataCache);

    // [1] Battlefield 필터링 추가
    const classicTop5 = bestData.filter(item => item.mode === 'Classic').slice(0, 6);
    const riftTop5 = bestData.filter(item => item.mode === 'Rift').slice(0, 6);
    const battlefieldTop5 = bestData.filter(item => item.mode === 'Battlefield').slice(0, 6);

    container.innerHTML = '';
    container.className = "mt-4 space-y-8 md:col-span-2";

    const renderSection = (title, data, modeLabel, sectionId) => {
        if (data.length === 0) return;

        const section = document.createElement('div');
        section.className = "space-y-3";

        const header = document.createElement('div');
        header.className = "flex items-center justify-between px-1 mb-2";

        // [2] 전장 모드를 위한 바 컬러 설정
        let barColorClass = 'bg-gray-500';
        if (sectionId === 'classic') barColorClass = 'bg-gray-700';
        if (sectionId === 'battlefield') barColorClass = 'bg-gray-700'; 

        header.innerHTML = `
            <h3 class="font-bold text-sm md:text-base flex items-center gap-2 text-gray-800">
                <span class="w-1 h-4 rounded-sm ${barColorClass}"></span>
                ${title}
            </h3>
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top 6</span>
        `;
        section.appendChild(header);

        const listGrid = document.createElement('div');
        listGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-3";

        data.forEach((item, index) => {
            const rank = index + 1;
            const heroInfo = heroDataCache.characters.find(c =>
                c.english_name === item.character || c.korean_name === item.character
            );

            const regionCode = (item.region || 'us').toLowerCase();
            const flagUrl = `https://flagcdn.com/w40/${regionCode}.png`;
            const englishName = heroInfo ? heroInfo.english_name : item.character;
            const fileName = englishName.replace(/\s+/g, '_');
            const imgPath = `./heroes/${fileName}.webp`;
            const displayName = heroInfo ? (lang === 'ko' ? heroInfo.korean_name : heroInfo.english_name) : item.character;

            const badgeLabel = sectionId === 'classic' ? (lang === 'ko' ? '단계' : 'STG') : (lang === 'ko' ? '고통' : 'Lv.');
            const badgeValue = sectionId === 'classic' ? (item.stage || "1") : (item.level || "0");

            let infoLabelText = "";
            if (sectionId === 'classic') {
                const levelText = lang === 'ko' ? '고통' : 'Lv.';
                infoLabelText = `${levelText} ${item.level} <span class="mx-0.5 text-gray-300">•</span> ${displayName}`;
            } else {
                infoLabelText = displayName;
            }

            // 캐릭터별 커스텀 위치 조정
            let objectPosition = "center 10%";
            let imageScale = "scale(1.3)";
            if (englishName === "Alessia") objectPosition = "center 40%";
            if (englishName === "Yoiko") { objectPosition = "center 10%"; imageScale = "scale(1.8) translateX(-5px)"; }
            if (englishName === "Vesper") { objectPosition = "center 30%"; imageScale = "scale(1.7)"; }
            if (englishName === "Jadetalon") { objectPosition = "center -20%"; imageScale = "scale(2) translateX(10px)"; }
            if (englishName === "Adelvyn") { objectPosition = "center 30%"; imageScale = "scale(1.3) translateX(-10px)"; }
            if (englishName === "Peddler") { objectPosition = "center 10%"; imageScale = "scale(1)   translateX(5px)"; }

            const card = document.createElement('div');
            card.className = "flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-md";
            card.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="font-bold ${rank <= 3 ? 'text-gray-700' : 'text-gray-400'} w-4 text-center italic text-xs">${rank}</span>
                    <div class="w-12 h-5 md:w-16 md:h-7 rounded bg-gray-100 border border-gray-100 overflow-hidden flex-shrink-0 relative">
                        <img src="${imgPath}" onerror="this.src='https://via.placeholder.com/48x20?text=Hero'" 
                             class="w-full h-full object-cover grayscale-[30%]" style="object-position: ${objectPosition}; transform: ${imageScale};">
                        <span class="absolute right-0 bottom-0 bg-red-600/80 text-[6px] md:text-[8px] text-white px-1 font-bold">
                            ${badgeLabel} ${badgeValue}
                        </span>
                    </div>
                    <div class="flex flex-col">
                        <div class="flex items-center gap-1.5">
                            <img src="${flagUrl}" class="w-4 h-3 object-cover rounded-[1px] shadow-sm opacity-80">
                            <span class="font-bold text-sm text-gray-700 cursor-pointer hover:text-black transition-colors" onclick="handleDirectJump('${item.userId}')">${item.userId}</span>
                        </div>
                        <span class="text-[8px] font-medium text-gray-400 uppercase mt-0.5">${infoLabelText}</span>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-0.5">
                    <span class="text-[8px] font-medium text-gray-400 uppercase tracking-tighter">
                        ${Number(item.totalScore).toLocaleString()} PTS
                    </span>
                    <span class="text-[11px] font-bold text-gray-900 tabular-nums tracking-tight">
                        ${item.time}
                    </span>
                </div>
            `;
            listGrid.appendChild(card);
        });

        section.appendChild(listGrid);
        container.appendChild(section);
    };

    const titleClassic = translations[lang]['fissure'] || "Spatial Interstice";
    const labelClassic = translations[lang]['fissureSub'] || "Classic";
    const titleRift = translations[lang]['rift'] || "The Rift";
    const labelRift = translations[lang]['riftSub'] || "Rift";
    const titleBattlefield = translations[lang]['battlefield'] || "Battlefield";

    renderSection(titleClassic, classicTop5, labelClassic, 'classic');
    renderSection(titleRift, riftTop5, labelRift, 'rift');
    renderSection(titleBattlefield, battlefieldTop5, 'Battlefield', 'battlefield');
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
}
/**
 * [script.js] 메인 데이터 로드 및 초기화
 * 온보딩 시 SK 로더 노출 차단 로직 추가
 */
async function loadRanking() {
    const container = document.getElementById('content-ranking');
    if (!container) return;

    // [추가] 첫 진입 시 SK 관련 요소(컨테이너 및 로더)를 즉시 숨김 처리
    const skContainer = document.getElementById('content-sk-ranking');
    const skLoader = document.getElementById('sk-loader');
    if (skContainer) skContainer.style.setProperty('display', 'none', 'important');
    //if (skLoader) skLoader.style.setProperty('display', 'none', 'important');

    try {
        // [수정] 세 가지 데이터를 동시에 로드
        const [rankingRes, heroRes, skHeroRes] = await Promise.all([
            fetch(GAS_URL),
            fetch('json/hero.json'),
            fetch('json/sk_hero.json').catch(() => null) // 파일이 없을 경우 대비
        ]);

        let rawData = await rankingRes.json();
        heroDataCache = await heroRes.json();

        // SK 영웅 데이터 저장
        if (skHeroRes) {
            skHeroDataCache = await skHeroRes.json();
        }
        
        if (!rawData || rawData.length === 0) return;

        // 데이터 정렬: 고통 레벨(내림차순) -> 시간(오름차순)
        rawData.sort((a, b) => {
            const lvA = parseInt(String(a.level || 0).replace(/[^0-9]/g, '')) || 0;
            const lvB = parseInt(String(b.level || 0).replace(/[^0-9]/g, '')) || 0;
            if (lvB !== lvA) return lvB - lvA;

            return String(a.time).localeCompare(String(b.time));
        });

        // 1. 유저별 + 모드별 최고 기록 선별
        const bestPerUser = rawData.filter((item, index, self) =>
            index === self.findIndex((t) => t.userId === item.userId && t.mode === item.mode)
        );

        // 2. 전체 데이터를 캐시에 저장 (중복 제거용)
        rankingDataCache = rawData.filter((item, index, self) =>
            index === self.findIndex((t) => (
                t.userId === item.userId && t.region === item.region &&
                t.character === item.character && t.time === item.time &&
                t.level === item.level && t.totalScore === item.totalScore &&
                t.stage === item.stage && t.mode === item.mode
            ))
        );

        // 3. 화면 갱신 (OWL 랭킹 슬라이드 실행)
        if (typeof renderRankingSlide === 'function') renderRankingSlide();

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

async function initDetailedRankPage() {
    const modeSelect = document.getElementById('detailed-filter-mode'); // 모드 필터 추가
    const heroSelect = document.getElementById('detailed-filter-hero');
    const levelSelect = document.getElementById('detailed-filter-level');
    const regionSelect = document.getElementById('detailed-filter-region');
    const lang = localStorage.getItem('owlog_lang') || 'ko';

    // 데이터 로드 대기
    if (!rankingDataCache || rankingDataCache.length === 0 || !heroDataCache) {
        setTimeout(initDetailedRankPage, 500);
        return;
    }

    // 1. [추가] 모드 필터 옵션 번역 및 초기값 설정
    if (modeSelect) {
        // 이전 선택값 유지 (없으면 Classic)
        const currentMode = modeSelect.value || "Classic";

        // 올모드 없이 두 가지만 존재하므로 index로 접근하여 번역 갱신
        if (translations[lang]) {
            modeSelect.options[0].text = translations[lang]['fissure'] || '공간의 틈새';
            modeSelect.options[1].text = translations[lang]['rift'] || '균열';
        }

        modeSelect.value = currentMode;
    }

    // 2. 캐릭터 필터 옵션 (기존 로직 유지)
    const currentHero = heroSelect.value;
    heroSelect.innerHTML = `<option value="">${translations[lang]['filter_all_heroes'] || 'All Heroes'}</option>`;
    heroDataCache.characters.forEach(hero => {
        const opt = document.createElement('option');
        opt.value = hero.english_name;
        opt.text = lang === 'ko' ? hero.korean_name : hero.english_name;
        heroSelect.add(opt);
    });
    heroSelect.value = currentHero;

    // 3. 레벨 필터 옵션 (번역 적용)
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

    // 4. 국가 필터 옵션 생성
    const currentRegion = regionSelect.value;
    regionSelect.innerHTML = `<option value="">${translations[lang]['label_region'] || 'All Regions'}</option>`;
    const regionNames = new Intl.DisplayNames([lang], { type: 'region' });

    isoCodes.forEach(code => {
        const opt = document.createElement('option');
        opt.value = code;
        try {
            opt.text = regionNames.of(code);
        } catch (e) {
            opt.text = code.toUpperCase();
        }
        regionSelect.add(opt);
    });
    regionSelect.value = currentRegion;

    // 최종 필터링 실행
    handleRankFilterChange();
}

/**
 * 상세 랭킹 페이지 - 필터링 및 데이터 갱신 로직 (전체)
 * 탭으로 선택된 모드와 드롭다운 필터들을 조합하여 결과 출력
 */
function handleRankFilterChange() {
    // 1. 현재 선택된 모든 필터 값 가져오기
    const modeVal = currentModeTab; // 탭 버튼 클릭 시 저장된 전역 변수 ("Classic" 또는 "Rift")
    const heroVal = document.getElementById('detailed-filter-hero').value;
    const levelVal = document.getElementById('detailed-filter-level').value;
    const regionVal = document.getElementById('detailed-filter-region').value;

    // 히어로 데이터에서 현재 선택된 영웅의 정보 찾기 (영어/한국어 매칭용)
    const selectedHeroInfo = heroDataCache ? heroDataCache.characters.find(c => c.english_name === heroVal) : null;

    // 2. 전체 데이터 캐시(rankingDataCache)에서 조건에 맞는 항목 필터링
    const filteredResult = rankingDataCache.filter(item => {
        /**
         * [모드 필터링] 
         * 탭에서 선택된 모드와 데이터의 mode 값이 일치해야 함
         * 시트 데이터의 미세한 공백 차이를 방지하기 위해 trim() 적용
         */
        const itemMode = (item.mode || "").trim();
        const matchMode = itemMode === modeVal;

        // [영웅 필터링]
        let matchHero = true;
        if (heroVal && selectedHeroInfo) {
            // 시트에 저장된 이름이 영문이거나 국문인 경우 모두 대응
            matchHero = (item.character === selectedHeroInfo.english_name ||
                item.character === selectedHeroInfo.korean_name);
        }

        // [레벨 필터링] (고통 레벨)
        const matchLevel = !levelVal || String(item.level) === levelVal;

        // [국가 필터링]
        const matchRegion = !regionVal || item.region === regionVal;

        // 모든 조건이 참일 때만 결과에 포함
        return matchMode && matchHero && matchLevel && matchRegion;
    });

    /**
     * 3. 유저별 최고 기록 추출
     * 필터링된 결과(특정 모드/영웅 등) 내에서 유저 한 명당 
     * 가장 성적이 좋은 기록(레벨 > 단계 > 시간 순) 단 하나만 선별합니다.
     */
    detailedRankData = getBestRecordsPerUser(filteredResult);

    /**
     * 4. UI 갱신
     * 리스트의 첫 페이지부터 보여주도록 설정하고 화면을 다시 그립니다.
     */
    detailedCurrentPage = 1;
    if (typeof renderDetailedRankList === 'function') {
        renderDetailedRankList();
    }
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
 * [script.js] 상세 기록 카드 생성 함수
 * 모드(SK vs OWL)에 따른 동적 스타일 및 경로 적용 버전
 */
function createDetailedRankCard(item, rank, lang) {
    // 1. 모드 판별
    const isSK = item.mode && item.mode.trim().toUpperCase() === 'SK';
    
    // 2. 캐릭터 정보 및 경로 설정
    let heroInfo, folder;
    if (isSK) {
        heroInfo = (skHeroDataCache && skHeroDataCache.characters) 
            ? skHeroDataCache.characters.find(c => c.english_name === item.character || c.korean_name === item.character)
            : null;
        folder = 'sk_heroes';
    } else {
        heroInfo = (heroDataCache && heroDataCache.characters)
            ? heroDataCache.characters.find(c => c.english_name === item.character || c.korean_name === item.character)
            : null;
        folder = 'heroes';
    }

    const englishName = heroInfo ? heroInfo.english_name : item.character;
    const displayName = heroInfo ? (lang === 'ko' ? heroInfo.korean_name : heroInfo.english_name) : item.character;
    const regionCode = (item.region || 'us').toLowerCase();
    const fileName = englishName.replace(/\s+/g, '_');

    // 3. 캐릭터별 커스텀 구도 (기존 OWL + SK 기본값)
    let objPos = "center 20%";
    let transform = "scale(1)";

    // SK 캐릭터용 기본 구도 설정
    if (isSK) {
        objPos = "center 10%";
        transform = "scale(1.3)";
    }

    // OWL 캐릭터 커스텀 구도
    if (englishName === "Yoiko") { objPos = "center 10%"; transform = "scale(1.8) translateX(-10px)"; }
    if (englishName === "Huo Yufeng") { objPos = "center 10%"; transform = "scale(1.5) translateX(5px)"; }
    if (englishName === "Alessia") { objPos = "center 40%"; }
    if (englishName === "Vesper") { objPos = "center 30%"; transform = "scale(1.5) translateX(5px)"; }
    if (englishName === "Jadetalon") { objPos = "center 10%"; transform = "scale(2) translateX(15px) translateY(5px)"; }
    if (englishName === "Hua Ling") { objPos = "center 10%"; transform = "scale(1.5) translateX(2px) translateY(5px)"; }
    if (englishName === "Zilan") { objPos = "center 30%"; transform = ""; }
    if (englishName === "Synthia") { objPos = "center 20%"; transform = "scale(1.5) translateX(-15px)"; }
    if (englishName === "Anibella") { objPos = "center 10%"; transform = "scale(1.5)"; }
    if (englishName === "Adelvyn") { objPos = "center 30%"; transform = "scale(1.3) translateX(-10px)"; }
    if (englishName === "Peddler") { objPos = "center 10%"; transform = "scale(1) translateX(10px)"; }

    // 4. 모드별 배지 및 색상 정의
    const badgeLabel = isSK ? "SK" : `Lv.${item.level}`;
    const badgeColor = isSK ? "bg-orange-600/90" : "bg-red-500";
    const rankColor = isSK && rank <= 3 ? "text-orange-500" : (rank <= 3 ? "text-yellow-500" : "text-gray-300");

    const card = document.createElement('div');
    card.className = "flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 opacity-0 transform translate-y-2";

    card.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="font-black ${rankColor} w-6 text-center italic text-base">${rank}</span>
            <div class="w-5 h-3.5 overflow-hidden rounded-[2px] shadow-sm border border-gray-100 flex-shrink-0 bg-white">
                <img src="https://flagcdn.com/w40/${regionCode}.png" class="w-full h-full object-cover">
            </div>
            <div class="w-14 h-6 md:w-20 md:h-8 rounded-lg bg-gray-200 overflow-hidden relative flex-shrink-0 border border-gray-100">
                <img src="./${folder}/${fileName}.webp" onerror="this.src='https://via.placeholder.com/80x32?text=Hero'" 
                     class="w-full h-full object-cover" style="object-position: ${objPos}; transform: ${transform};">
                <span class="absolute right-0 bottom-0 ${badgeColor} text-[8px] text-white px-1 font-bold">${badgeLabel}</span>
            </div>
            <div class="flex flex-col">
                <span class="font-bold text-sm md:text-base text-gray-800 leading-none cursor-pointer" 
                  onclick="handleDirectJump('${item.userId}')">
                ${item.userId}
            </span>
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
/**
 * 검색 유저 프로필 업데이트
 * SK 캐릭터일 경우 전용 경로(./sk_heroes/)와 데이터를 사용하도록 보정
 */
function updateSearchProfile(userId) {
    const lang = localStorage.getItem('owlog_lang') || 'en';
    const firstItem = currentUserRecords[0]; 

    // 1. 캐릭터별 플레이 횟수 계산
    const charCounts = {};
    currentUserRecords.forEach(r => charCounts[r.character] = (charCounts[r.character] || 0) + 1);
    const mostPlayedChar = Object.keys(charCounts).reduce((a, b) => charCounts[a] > charCounts[b] ? a : b);

    // 2. 해당 캐릭터의 기록을 찾아 SK 모드 여부 확인
    const sampleRecord = currentUserRecords.find(r => r.character === mostPlayedChar);
    const isSK = sampleRecord && sampleRecord.mode && sampleRecord.mode.trim().toUpperCase() === 'SK';

    // 3. 모드에 따른 데이터 캐시 및 이미지 경로 설정
    let heroInfo, folder, transform, objPos;

    if (isSK) {
        // 소울 나이트 캐릭터인 경우
        heroInfo = (skHeroDataCache && skHeroDataCache.characters) 
            ? skHeroDataCache.characters.find(c => c.english_name === mostPlayedChar || c.korean_name === mostPlayedChar)
            : null;
        folder = 'sk_heroes';
        transform = 'scale(1.3)'; // SK 전용 배율
        objPos = 'center 10%';
    } else {
        // 일반 OWL 캐릭터인 경우
        heroInfo = (heroDataCache && heroDataCache.characters)
            ? heroDataCache.characters.find(c => c.english_name === mostPlayedChar || c.korean_name === mostPlayedChar)
            : null;
        folder = 'heroes';
        transform = 'scale(1.2)';
        objPos = 'center 20%';
    }

    const fileName = heroInfo ? heroInfo.english_name.replace(/\s+/g, '_') : 'Hero';
    const imgPath = `./${folder}/${fileName}.webp`; // 동적 경로 할당

    // 4. 텍스트 및 이미지 주입
    document.getElementById('search-user-id').innerText = userId;
    document.getElementById('search-user-region').innerText = firstItem.region;
    document.getElementById('search-last-update').innerText = `Last updated: ${firstItem.time || '---'}`;
    document.getElementById('search-total-play').innerText = `${currentUserRecords.length} PLAYS`;

    document.getElementById('search-user-flag').innerHTML = `
        <img src="https://flagcdn.com/w40/${firstItem.region.toLowerCase()}.png" class="w-full h-full object-cover">
    `;

    document.getElementById('search-profile-img').innerHTML = `
        <img src="${imgPath}" onerror="this.src='https://via.placeholder.com/80x80?text=Hero'" 
             class="w-full h-full object-cover" style="object-position: ${objPos}; transform: ${transform};">
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
 * [script.js] 검색된 유저의 통계를 모드별로 그룹화하여 렌더링
 */
function renderSearchSummary() {
    const container = document.getElementById('search-content-summary');
    const lang = localStorage.getItem('owlog_lang') || 'en';
    if (!container) return;
    
    container.innerHTML = '';

    // 1. 데이터를 모드별 -> 캐릭터별로 그룹화
    const modeGroups = {};

    currentUserRecords.forEach(item => {
        const mode = item.mode ? item.mode.trim().toUpperCase() : 'CLASSIC';
        
        if (!modeGroups[mode]) {
            modeGroups[mode] = {};
        }

        if (!modeGroups[mode][item.character]) {
            modeGroups[mode][item.character] = { 
                count: 0, 
                totalScore: 0, 
                maxScore: 0
            };
        }

        const score = Number(item.totalScore);
        const stats = modeGroups[mode][item.character];
        stats.count++;
        stats.totalScore += score;
        if (score > stats.maxScore) stats.maxScore = score;
    });

    // 2. 모드별로 섹션 생성 및 렌더링
    // 표시 순서 조정 (원하는 순서가 있다면 배열로 정의 가능)
    const sortedModes = Object.keys(modeGroups).sort((a, b) => (a === 'SK' ? -1 : 1));

    sortedModes.forEach(modeKey => {
        const characters = modeGroups[modeKey];
        const isSK = modeKey === 'SK';

        // 모드 섹션 헤더 추가
        const sectionHeader = document.createElement('div');
        sectionHeader.className = "flex items-center gap-2 px-2 mt-6 mb-3";
        
        // 모드별 표시 명칭 설정
        let modeDisplayName = modeKey;
        if (modeKey === 'SK') modeDisplayName = 'Soul Knight';
        else if (modeKey === 'CLASSIC') modeDisplayName = translations[lang]['fissureSub'] || 'Spatial Interstice';
        else if (modeKey === 'RIFT') modeDisplayName = translations[lang]['riftSub'] || 'The Rift';
        else if (modeKey === 'BATTLEFIELD') modeDisplayName = 'Battlefield';

        sectionHeader.innerHTML = `
            <span class="w-1 h-4 rounded-sm ${isSK ? 'bg-orange-500' : 'bg-gray-700'}"></span>
            <h4 class="font-bold text-sm text-gray-800 uppercase tracking-tight">${modeDisplayName}</h4>
        `;
        container.appendChild(sectionHeader);

        // 해당 모드의 캐릭터 카드들 생성
        Object.keys(characters).forEach(charName => {
            const s = characters[charName];
            const avgScore = Math.round(s.totalScore / s.count);

            // 이미지 정보 및 폴더 설정
            let heroInfo, folder;
            if (isSK) {
                heroInfo = (skHeroDataCache && skHeroDataCache.characters)
                    ? skHeroDataCache.characters.find(c => c.english_name === charName || c.korean_name === charName)
                    : null;
                folder = 'sk_heroes';
            } else {
                heroInfo = (heroDataCache && heroDataCache.characters)
                    ? heroDataCache.characters.find(c => c.english_name === charName || c.korean_name === charName)
                    : null;
                folder = 'heroes';
            }

            const englishName = heroInfo ? heroInfo.english_name : charName;
            const fileName = englishName.replace(/\s+/g, '_');
            const displayName = heroInfo ? (lang === 'ko' ? heroInfo.korean_name : heroInfo.english_name) : charName;

            const row = document.createElement('div');
            row.className = "bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm mb-3 last:mb-0";
            row.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden relative">
                        <img src="./${folder}/${fileName}.webp" 
                             onerror="this.src='https://via.placeholder.com/48x48?text=Hero'" 
                             class="w-full h-full object-cover">
                        ${isSK ? '<span class="absolute bottom-0 right-0 bg-orange-600 text-[6px] text-white px-1 font-bold">SK</span>' : ''}
                    </div>
                    <div>
                        <p class="font-black text-sm text-gray-800">${displayName}</p>
                        <p class="text-[10px] font-bold text-gray-400 uppercase">${s.count} GAMES PLAYED</p>
                    </div>
                </div>
                <div class="flex gap-6 text-right">
                    <div>
                        <p class="text-[9px] font-bold text-gray-400 uppercase">Best</p>
                        <p class="text-xs font-black ${isSK ? 'text-orange-500' : 'text-blue-600'}">${s.maxScore.toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-[9px] font-bold text-gray-400 uppercase">Avg</p>
                        <p class="text-xs font-black text-gray-800">${avgScore.toLocaleString()}</p>
                    </div>
                </div>
            `;
            container.appendChild(row);
        });
    });
}
/**
 * [script.js] 유저 검색 및 프로필/최고 기록 업데이트
 * SK 모드 대응 및 이미지 경로 최적화 버전
 */
function performUserSearch(query) {
    if (!query) return;
    const lang = localStorage.getItem('owlog_lang') || 'en';

    // 1. 유저 데이터 필터링
    const userRecords = rankingDataCache.filter(item =>
        item.userId.toLowerCase() === query.toLowerCase()
    );

    if (userRecords.length === 0) {
        alert(lang === 'ko' ? "등록된 기록이 없는 유저입니다." : "No records found for this user.");
        return;
    }

    // 2. 대표 캐릭터 찾기 및 모드 판별
    const charCounts = {};
    userRecords.forEach(r => charCounts[r.character] = (charCounts[r.character] || 0) + 1);
    const mostPlayedChar = Object.keys(charCounts).reduce((a, b) => charCounts[a] > charCounts[b] ? a : b);

    // 해당 캐릭터가 SK 캐릭터인지 확인
    const sampleRecord = userRecords.find(r => r.character === mostPlayedChar);
    const isSKUser = sampleRecord && sampleRecord.mode && sampleRecord.mode.trim().toUpperCase() === 'SK';

    // 3. 최고 기록 계산 (모드별 기준 상이)
    const topRecord = [...userRecords].sort((a, b) => {
        if (isSKUser) {
            // SK: 데미지(점수)가 높은 순서 우선
            return (Number(b.totalScore || 0)) - (Number(a.totalScore || 0));
        } else {
            // OWL: 레벨(내림차순) -> 시간(오름차순)
            const lvA = parseInt(String(a.level || 0).replace(/[^0-9]/g, '')) || 0;
            const lvB = parseInt(String(b.level || 0).replace(/[^0-9]/g, '')) || 0;
            if (lvB !== lvA) return lvB - lvA;
            return String(a.time || "").localeCompare(String(b.time || ""));
        }
    })[0];

    // 4. 검색 결과 뷰 활성화 및 데이터 바인딩
    document.getElementById('search-loading-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.remove('hidden');
    searchUserRecordsRef = [...userRecords];
    switchTab('search');

    // 5. 프로필 UI 업데이트
    document.getElementById('search-user-id').innerText = query;
    document.getElementById('search-user-region').innerText = topRecord.region;
    document.getElementById('search-total-play').innerText = userRecords.length;

    // 모드에 따른 최고 기록 텍스트 포맷 변경
    if (isSKUser) {
        const damageText = Number(topRecord.totalScore).toLocaleString();
        document.getElementById('search-last-update').innerText = `${damageText}`;
    } else {
        document.getElementById('search-last-update').innerText = `${topRecord.time}`;
    }

    // 6. 대표 캐릭터 이미지 업데이트 (SK vs OWL 폴더 구분)
    let heroInfo, folder, transform, objPos;

    if (isSKUser) {
        heroInfo = (skHeroDataCache && skHeroDataCache.characters) 
            ? skHeroDataCache.characters.find(c => c.english_name === mostPlayedChar || c.korean_name === mostPlayedChar)
            : null;
        folder = 'sk_heroes';
        transform = 'scale(1.4)';
        objPos = 'center 10%';
    } else {
        heroInfo = (heroDataCache && heroDataCache.characters)
            ? heroDataCache.characters.find(c => c.english_name === mostPlayedChar || c.korean_name === mostPlayedChar)
            : null;
        folder = 'heroes';
        transform = 'scale(1.4)';
        objPos = 'center 10%';
    }

    const fileName = heroInfo ? heroInfo.english_name.replace(/\s+/g, '_') : 'Hero';
    
    document.getElementById('search-user-flag').innerHTML = `
        <img src="https://flagcdn.com/w40/${topRecord.region.toLowerCase()}.png" class="w-full h-full object-cover">
    `;
    document.getElementById('search-profile-img').innerHTML = `
        <img src="./${folder}/${fileName}.webp" 
             class="w-full h-full object-cover" style="transform: ${transform}; object-position: ${objPos};">
    `;

    switchSearchTab('records');
}
let searchCurrentPage = 1;
const searchItemsPerPage = 10;

/**
 * 1. 검색 탭 전환 로직 수정
 */
function switchSearchTab(type) {
    // 요소를 먼저 정의합니다.
    const recView = document.getElementById('search-records-view'); // 기록+페이징 그룹
    const sumCont = document.getElementById('search-content-summary');
    const recBtn = document.getElementById('search-tab-records');
    const sumBtn = document.getElementById('search-tab-summary');
    const lang = localStorage.getItem('owlog_lang') || 'en';

    // 요소가 모두 존재하는지 확인
    if (!recView || !sumCont || !recBtn || !sumBtn) return;

    if (type === 'records') {
        // [기록 탭 활성화]
        recView.classList.remove('hidden');
        sumCont.classList.add('hidden');

        // 버튼 활성화 스타일 적용
        recBtn.className = "flex-1 py-4 text-center text-[13px] md:text-sm tab-active transition-all";
        sumBtn.className = "flex-1 py-4 text-center text-[13px] md:text-sm text-gray-400 font-medium transition-all";

        searchCurrentPage = 1;
        renderSearchRecordsPage();
    } else {
        // [요약 탭 활성화]
        sumCont.classList.remove('hidden');
        recView.classList.add('hidden'); // 그룹 전체를 숨겨 md:grid 충돌 방지

        // 버튼 활성화 스타일 적용
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
 * [script.js] 검색 유저의 통계 요약을 모드별로 그룹화하여 렌더링
 */
function renderSummaryStats(container, lang) {
    if (!container || !searchUserRecordsRef) return;
    const currentLang = lang || localStorage.getItem('owlog_lang') || 'en';

    // 1. 데이터를 모드별 -> 캐릭터별로 그룹화
    const modeGroups = {};

    searchUserRecordsRef.forEach(item => {
        const mode = item.mode ? item.mode.trim().toUpperCase() : 'CLASSIC';
        const isSK = mode === 'SK';
        
        // 해당 모드에 맞는 히어로 캐시 선택
        const cache = isSK ? skHeroDataCache : heroDataCache;
        const heroInfo = cache && cache.characters ? cache.characters.find(c =>
            c.english_name === item.character || c.korean_name === item.character
        ) : null;

        const charKey = heroInfo ? heroInfo.english_name : item.character;

        if (!modeGroups[mode]) {
            modeGroups[mode] = {};
        }

        if (!modeGroups[mode][charKey]) {
            modeGroups[mode][charKey] = { count: 0, max: 0, total: 0, info: heroInfo };
        }

        const score = Number(item.totalScore);
        const s = modeGroups[mode][charKey];
        s.count++;
        s.total += score;
        if (score > s.max) s.max = score;
    });

    container.innerHTML = '';

    const labelGames = currentLang === 'ko' ? '판 플레이' : 'GAMES';
    const labelBest = translations[currentLang]['label_best'] || 'Best';
    const labelAvg = translations[currentLang]['label_avg'] || 'Average';

    // 2. 모드별로 섹션 정렬 및 출력 (SK 우선순위)
    const sortedModes = Object.keys(modeGroups).sort((a, b) => (a === 'SK' ? -1 : 1));

    sortedModes.forEach(modeKey => {
        const isSK = modeKey === 'SK';
        const characters = modeGroups[modeKey];

        // 모드 섹션 헤더 추가
        const sectionHeader = document.createElement('div');
        sectionHeader.className = "flex items-center gap-2 px-2 mt-6 mb-3";
        
        let modeDisplayName = modeKey;
        if (modeKey === 'SK') modeDisplayName = 'Soul Knight';
        else if (modeKey === 'CLASSIC') modeDisplayName = translations[currentLang]['fissureSub'] || 'Spatial Interstice';
        else if (modeKey === 'RIFT') modeDisplayName = translations[currentLang]['riftSub'] || 'The Rift';
        else if (modeKey === 'BATTLEFIELD') modeDisplayName = 'Battlefield';

        sectionHeader.innerHTML = `
            <span class="w-1 h-4 rounded-sm ${isSK ? 'bg-orange-500' : 'bg-gray-700'}"></span>
            <h4 class="font-bold text-sm text-gray-800 uppercase tracking-tight">${modeDisplayName}</h4>
        `;
        container.appendChild(sectionHeader);

        // 해당 모드의 캐릭터 카드들 생성
        Object.keys(characters).forEach(charKey => {
            const s = characters[charKey];
            const heroInfo = s.info;
            const displayName = heroInfo ? (currentLang === 'ko' ? heroInfo.korean_name : heroInfo.english_name) : charKey;
            const fileName = charKey.replace(/\s+/g, '_');
            const folder = isSK ? 'sk_heroes' : 'heroes';
            const bestScoreColor = isSK ? 'text-orange-500' : 'text-blue-500';

            const row = document.createElement('div');
            row.className = "bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm mb-3";
            row.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-white border border-gray-100 overflow-hidden flex-shrink-0 relative">
                        <img src="./${folder}/${fileName}.webp" 
                             onerror="this.src='https://via.placeholder.com/56x56?text=Hero'"
                             class="w-full h-full object-cover">
                        ${isSK ? '<span class="absolute bottom-0 right-0 bg-orange-600 text-[6px] text-white px-1 font-bold">SK</span>' : ''}
                    </div>
                    <div>
                        <p class="font-black text-sm text-gray-800">${displayName}</p>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tight">${s.count} ${labelGames}</p>
                    </div>
                </div>
                <div class="flex gap-6 md:gap-10 text-right">
                    <div>
                        <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">${labelBest}</p>
                        <p class="text-sm font-black ${bestScoreColor}">${s.max.toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">${labelAvg}</p>
                        <p class="text-sm font-black text-gray-900">${Math.round(s.total / s.count).toLocaleString()}</p>
                    </div>
                </div>
            `;
            container.appendChild(row);
        });
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

/**
 * 유저별 + 모드별 최고 기록 추출
 * (우선순위: 레벨 > 단계 > 시간)
 */
function getBestRecordsPerUser(data) {
    if (!data || data.length === 0) return [];

    // 1. 우선순위에 따라 전체 데이터 정렬
    const sortedData = [...data].sort((a, b) => {
        // A. 고통 레벨 비교 (내림차순)
        const lvA = parseInt(String(a.level || 0).replace(/[^0-9]/g, '')) || 0;
        const lvB = parseInt(String(b.level || 0).replace(/[^0-9]/g, '')) || 0;
        if (lvB !== lvA) return lvB - lvA;

        // B. 단계 비교 (내림차순)
        const stgA = parseInt(String(a.stage || 0).replace(/[^0-9]/g, '')) || 0;
        const stgB = parseInt(String(b.stage || 0).replace(/[^0-9]/g, '')) || 0;
        if (stgB !== stgA) return stgB - stgA;

        // C. 최단 시간 비교 (오름차순)
        return String(a.time || "").localeCompare(String(b.time || ""));
    });

    // 2. 유저 ID와 모드(Mode)의 조합이 처음 나타나는 데이터만 필터링
    return sortedData.filter((item, index, self) =>
        index === self.findIndex((t) => (
            t.userId === item.userId &&
            t.mode === item.mode // 유저 ID뿐만 아니라 모드까지 체크하여 중복 제거
        ))
    );
}
/**
 * OWLOG - 상세 랭킹 데이터 로드 (유저당 1개 레코드 제한)
 */
async function loadMainRanking() {
    const loader = document.getElementById('rank-main-loader');
    const content = document.getElementById('rank-main-content');

    if (!loader || !content) return;
    loader.classList.remove('hidden');
    content.classList.add('hidden');

    try {
        const response = await fetch(GAS_URL);
        let data = await response.json();

        // [핵심] 유저별 최고 기록만 남기기
        const bestData = data.sort((a, b) => {
            const lvA = parseInt(String(a.level || 0).replace(/[^0-9]/g, '')) || 0;
            const lvB = parseInt(String(b.level || 0).replace(/[^0-9]/g, '')) || 0;
            if (lvB !== lvA) return lvB - lvA;
            return String(a.time || "").localeCompare(String(b.time || ""));
        }).filter((item, index, self) =>
            index === self.findIndex((t) => t.userId === item.userId)
        );

        // 렌더링 호출
        if (typeof renderDetailedRankList === 'function') {
            renderDetailedRankList(bestData);
        }

        loader.classList.add('hidden');
        content.classList.remove('hidden');
    } catch (error) {
        console.error("Load Error:", error);
        loader.innerHTML = `<p class="text-xs font-bold text-red-400">FAILED TO SYNC DATABASE</p>`;
    }
}
/**
 * [script.js] 프로필에서 홈으로 돌아가기
 */
function goBackToHome() {
    // 1. 메인 탭을 홈으로 전환합니다.
    switchTab('home');

    // 2. URL 파라미터가 있다면 제거하여 깨끗한 상태로 만듭니다 (선택 사항)
    if (window.location.search.includes('id=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 3. 페이지 상단으로 스크롤 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


let selectedGameMode = ''; // 현재 선택된 모드 저장용

/**
 * 1. 기록 등록하기 클릭 시 실행
 */
function openScanner() {
    // 스캐너를 바로 여는 대신 모드 선택 모달을 오픈
    document.getElementById('modeSelectModal').classList.remove('hidden');
}

function closeModeModal() {
    const modeModal = document.getElementById('modeSelectModal');
    if (modeModal) {
        modeModal.classList.add('hidden');
    }
}
// 1. 전역 변수 선언 (함수 밖 상단에 위치)
let currentEntry = { game: '', mode: '' };
/**
 * 2. selectMode 함수 수정 (불필요한 fetch 제거 및 전역 translations 사용)
 */
/**
 * [수정된 selectMode] 게임 종류에 따라 스캐너 모달 분기 처리
 */
async function selectMode(game, mode) {
    currentEntry.game = game;
    currentEntry.mode = mode;

    // 모드 선택 모달 닫기
    const modeModal = document.getElementById('modeSelectModal');
    if (modeModal) modeModal.classList.add('hidden');

    // [1] 소울 나이트 전용 분기
    if (game === 'Soul Knight') {
        const skScannerModal = document.getElementById('skScannerModal');
        if (skScannerModal) skScannerModal.classList.remove('hidden');

        // SK 스캐너 헤더 타이틀 처리
        const skHeaderTitle = document.getElementById('skScannerHeaderTitle');
        if (skHeaderTitle) {
            const lang = localStorage.getItem('owlog_lang') || 'ko';
            const recordKey = mode + '_record'; // 예: 'void_record'

            if (translations[lang] && translations[lang][recordKey]) {
                skHeaderTitle.innerText = translations[lang][recordKey];
                skHeaderTitle.setAttribute('data-i18n', recordKey);
            } else {
                skHeaderTitle.innerText = (mode === 'void') ? "심연 기록" : "SK 기록";
            }
        }

        // sk_scanner.js 초기화 함수 호출 (함수가 정의되어 있을 경우)
        if (typeof initSKScanner === 'function') initSKScanner();

    }
    // [2] 기존 OWL 게임 분기
    else {
        const scannerModal = document.getElementById('scannerModal');
        if (scannerModal) scannerModal.classList.remove('hidden');

        const headerTitle = document.getElementById('scannerHeaderTitle');
        if (headerTitle) {
            const lang = localStorage.getItem('owlog_lang') || 'ko';
            const recordKey = (mode === 'fissure') ? 'fissure_record' :
                (mode === 'rift' ? 'rift_record' : 'battlefield_record');

            if (translations[lang] && translations[lang][recordKey]) {
                headerTitle.innerText = translations[lang][recordKey];
                headerTitle.setAttribute('data-i18n', recordKey);
            } else {
                headerTitle.innerText = (mode === 'fissure') ? "공간의 틈새 기록" :
                    (mode === 'rift' ? "균열 기록" : "전장 기록 ");
            }

            // 헤더 컬러 설정
            headerTitle.style.color = (mode === 'fissure') ? '#2563eb' :
                (mode === 'rift' ? '#9333ea' : '#16a34a');
        }
    }

    if (typeof updateContent === 'function') updateContent();
}
/**
 * SK 스캐너 닫기
 */
function closeSKScanner() {
    document.getElementById('skScannerModal').classList.add('hidden');
    // 입력 필드 초기화 로직 추가
}

/**
 * OWLOG - 데이터 저장 로직 (최종본)
 * 1. 공간의 틈새: 3단계 이상만 저장 가능, 모드명 'Classic'
 * 2. 균열: 단계 1로 고정, 모드명 'Rift'
 */
/**
 * OWLOG - 데이터 저장 로직 (최종본)
 * 1. 공간의 틈새: 3단계 이상만 저장 가능
 * 2. 공간의 전장: 200,000점 이상만 저장 가능 [추가]
 * 3. 균열: 단계 1로 고정
 */
async function saveRecord(event) {
    if (event) event.preventDefault();

    const lang = localStorage.getItem('owlog_lang') || 'ko';
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.innerText;

    // [1] 현재 선택된 모드 및 스캔 데이터 가져오기
    const mode = currentEntry.mode; // 'fissure', 'rift', 'battlefield'
    const scannedStage = parseInt(lastScannedData.stage) || 1;
    const totalScore = parseInt(lastScannedData.totalScore) || 0;

    // [2] 유효성 검사
    // A. 공간의 틈새 3단계 제한
    if (mode === 'fissure' && scannedStage < 3) {
        const msg = lang === 'ko'
            ? "공간의 틈새는 3단계 이상 기록만 저장할 수 있습니다."
            : "Spatial Interstice records require Stage 3 or higher.";
        alert(msg);
        return;
    }

    // B. 공간의 전장 200,000점 제한 [신규 추가]
    if (mode === 'battlefield' && totalScore < 200000) {
        const msg = lang === 'ko'
            ? "전장 기록은 200,000점 이상 기록만 저장할 수 있습니다."
            : "Battlefield records require 200,000 points or higher.";
        alert(msg);
        return;
    }

    saveBtn.disabled = true;
    saveBtn.innerText = lang === 'ko' ? "저장 중..." : "Saving...";

    try {
        const nickname = document.getElementById('userNickname').value.trim();
        const region = document.getElementById('userRegion').value;
        const charName = document.getElementById('resName').value;

        if (!nickname) {
            alert(lang === 'ko' ? "닉네임을 입력해주세요." : "Please enter a nickname.");
            saveBtn.disabled = false;
            saveBtn.innerText = originalText;
            return;
        }

        // [3] 페이로드 구성 (I열: mode 명칭 매핑)
        const payload = {
            userId: nickname,
            region: region,
            character: charName,
            time: `'${lastScannedData.time}`,
            level: lastScannedData.level,
            totalScore: totalScore,
            // 전장과 균열은 단계를 1로 고정
            stage: mode === 'fissure' ? scannedStage : 1,
            mode: mode === 'fissure' ? 'Classic' : (mode === 'rift' ? 'Rift' : 'Battlefield')
        };

        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        alert(lang === 'ko' ? "기록이 성공적으로 저장되었습니다!" : "Record saved successfully!");
        location.reload();

    } catch (error) {
        if (error.message === "Failed to fetch" || error.name === "TypeError") {
            alert(lang === 'ko' ? "기록이 성공적으로 저장되었습니다!" : "Record saved successfully!");
            location.reload();
        } else {
            //console.error("Save Error:", error);
            //alert(lang === 'ko' ? "저장 중 에러가 발생했습니다." : "An error occurred while saving.");
        }
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = originalText;
    }
}

function switchModeTab(mode) {
    currentModeTab = mode; // 전역 변수 업데이트 ("Classic", "Rift", "Battlefield")

    const tabs = {
        'Classic': document.getElementById('tab-classic'),
        'Rift': document.getElementById('tab-rift'),
        'Battlefield': document.getElementById('tab-battlefield')
    };

    // 스타일 초기화 및 활성화 처리
    Object.keys(tabs).forEach(key => {
        const btn = tabs[key];
        if (!btn) return;

        if (key === mode) {
            // 활성 상태 스타일
            btn.className = "flex-1 py-3 text-sm font-bold rounded-xl transition-all bg-black text-white shadow-sm";
        } else {
            // 비활성 상태 스타일
            btn.className = "flex-1 py-3 text-sm font-bold rounded-xl transition-all text-gray-500 hover:text-gray-700";
        }
    });

    // 필터링된 데이터 재렌더링 호출
    handleRankFilterChange();
}

/**
 * [script.js] 소울 나이트 전용 랭킹 슬라이드 렌더링
 * 콤팩트 스타일(p-3) 및 레이아웃 최적화 버전
 */


function renderSKRankingSlid1e() {
    const lang = localStorage.getItem('owlog_lang') || 'ko';
    const container = document.getElementById('content-sk-ranking');

    // 1. 필수 데이터 및 컨테이너 확인
    if (!container || !rankingDataCache.length || !translations[lang]) return;

    // 2. 기존 로딩 UI 및 잔상 제거 (로딩 중복 방지 핵심)
    container.innerHTML = '';

    // 3. SK 모드 데이터 추출 및 정렬 (Top 6)
    const bestData = getBestRecordsPerUser(rankingDataCache);
    const skTop6 = bestData.filter(item =>
        item.mode && item.mode.trim().toUpperCase() === 'SK'
    ).slice(0, 22);

    // 데이터가 없을 경우 안내 문구 출력
    if (skTop6.length === 0) {
        const msg = translations[lang]['no_sk_records'] || "No SK Records Found";
        container.innerHTML = `<div class="py-20 text-center text-gray-300 font-bold uppercase md:col-span-2">${msg}</div>`;
        return;
    }

    // 4. 헤더 생성 (마진 mb-1로 밀착)
    const titleVoid = translations[lang]['void'] || "Void";
    const header = document.createElement('div');
    header.className = "flex items-center justify-between px-1 mb-1 md:col-span-2"; 
    header.innerHTML = `
        <h3 class="font-bold text-sm md:text-base flex items-center gap-2 text-gray-800">
            <span class="w-1 h-4 rounded-sm bg-orange-500"></span>
            <span data-i18n="void">${titleVoid}</span>
        </h3>
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top 6</span>
    `;
    container.appendChild(header);

    // 5. 카드 리스트 렌더링
    skTop6.forEach((item, index) => {
        const rank = index + 1;
        const regionCode = (item.region || 'us').toLowerCase();
        const flagUrl = `https://flagcdn.com/w40/${regionCode}.png`;
        
        // [캐릭터명 치환] 한글/영어 혼용 데이터를 영어 파일명으로 변환
        const heroInfo = (skHeroDataCache && skHeroDataCache.characters) 
            ? skHeroDataCache.characters.find(c => c.english_name === item.character || c.korean_name === item.character)
            : null;

        const englishName = heroInfo ? heroInfo.english_name : item.character;
        const fileName = englishName.replace(/\s+/g, '_');
        const imgPath = `./sk_heroes/${fileName}.webp`; // 영문 파일명 경로
        const displayName = heroInfo ? (lang === 'ko' ? heroInfo.korean_name : heroInfo.english_name) : item.character;

        const card = document.createElement('div');
        // 요청하신 p-3 콤팩트 스타일 클래스
        card.className = "flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-md";

        // 요청하신 카드 내부 구조 (PTS/Time 포맷 유지)
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="font-bold ${rank <= 3 ? 'text-orange-500' : 'text-gray-400'} w-4 text-center italic text-xs">${rank}</span>
                <div class="w-12 h-5 md:w-16 md:h-7 rounded bg-gray-100 border border-gray-100 overflow-hidden flex-shrink-0 relative">
                    <img src="${imgPath}"  style="object-position:50%" onerror="this.src='https://via.placeholder.com/48x20?text=Hero'" 
                         class="w-full h-full object-cover grayscale-[30%]" style="object-position: center 10%; transform: scale(1.3);">
                    <span class="absolute right-0 bottom-0 bg-orange-600/80 text-[6px] md:text-[8px] text-white px-1 font-bold">
                        SK
                    </span>
                </div>
                <div class="flex flex-col">
                    <div class="flex items-center gap-1.5">
                        <img src="${flagUrl}" class="w-4 h-3 object-cover rounded-[1px] shadow-sm opacity-80">
                        <span class="font-bold text-sm text-gray-700 cursor-pointer hover:text-black transition-colors" onclick="handleDirectJump('${item.userId}')">${item.userId}</span>
                    </div>
                    <span class="text-[8px] font-medium text-gray-400 uppercase mt-0.5">${displayName}</span>
                </div>
            </div>
            <div class="flex flex-col items-end gap-0.5">
                <span class="text-[8px] font-medium text-gray-400 uppercase tracking-tighter">
                    ${Number(item.totalScore).toLocaleString()} PTS
                </span>
                <span class="text-[11px] font-bold text-gray-900 tabular-nums tracking-tight">
                    ${item.time}
                </span>
            </div>
        `;
        container.appendChild(card);
    });
}
let currentCropCallback = null;

// 모달 열기 함수
function openCropModal(imageSrc, callback) {
    const modal = document.getElementById('cropModal');
    const image = document.getElementById('cropTarget');
    if (!modal || !image) return;

    currentCropCallback = callback; // 크랍 완료 시 실행할 함수 저장
    image.src = imageSrc;
    modal.classList.remove('hidden');

    // 이전 크로퍼 인스턴스 제거 후 새로 생성
    if (cropper) cropper.destroy();

    cropper = new Cropper(image, {
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.9,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
    });
}

// script.js 내의 함수 수정
function confirmCrop() {
    if (!cropper || !currentCropCallback) return;

    // 1. 크랍된 영역 가져오기
    const canvas = cropper.getCroppedCanvas();
    
    // 2. 모달 닫기 (추가됨)
    // 여기서 닫아주면 어떤 스캐너를 쓰든 크랍 확인 시 모달이 즉시 닫힙니다.
    closeCropModal(); 

    // 3. 예약된 분석 함수(runMainScan 또는 confirmSKCrop) 실행
    currentCropCallback(canvas); 
}


// 모달 닫기
function closeCropModal() {
    const modal = document.getElementById('cropModal');
    if (modal) modal.classList.add('hidden');
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

function initSKScanner() {
    const skInput = document.getElementById('skImageInput');
    // 이미 이벤트가 등록되어 있는지 확인하거나, 한 번만 실행되도록 처리
    if (skInput && !skInput.dataset.bound) {
        skInput.onchange = handleSKImageUpload;
        skInput.dataset.bound = "true";
    }
    // 데이터 로드는 모달을 열 때마다 갱신해도 무방함
    populateSKRegions();
    loadSKHeroData();
}
/**
 * OWLOG - 캐릭터별 글로벌 랭킹 리스트 (최종 수정본)
 * 레이아웃: 모드 | 국기 닉네임 (상단), 시간 (닉네임 하단)
 * 정렬: 기록이 있는 캐릭터 우선 상단 노출
 */
function renderSKRankingSlide() {
    const lang = localStorage.getItem('owlog_lang') || 'ko';
    const container = document.getElementById('content-sk-ranking');

    // [1] 필수 데이터 및 번역 객체 로드 확인
    if (!container || !rankingDataCache || rankingDataCache.length === 0 || !heroDataCache || !translations[lang]) {
        return;
    }

    container.innerHTML = '';
    // PC 2열, 모바일 1열 그리드 설정
    container.className = "mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2";

    // [2] 번역 키 적용 (idle.json에 해당 키가 있어야 함)
    const titleText = translations[lang]['character_leaderboard'] || "Global Best by Hero";
    const subTitleText = translations[lang]['global_best'] || "Global Best";

    // [3] 영웅 정렬: 기록(records)이 많은 캐릭터를 상단으로
    const sortedHeroes = [...heroDataCache.characters].map(hero => {
        const records = rankingDataCache.filter(r => 
            r.character === hero.english_name || r.character === hero.korean_name
        );
        return { ...hero, records };
    }).sort((a, b) => b.records.length - a.records.length);

    // [4] 섹션 헤더 생성
    const header = document.createElement('div');
    header.className = "flex items-center justify-between px-1 mb-1 md:col-span-2"; 
    header.innerHTML = `
        <h3 class="font-bold text-sm md:text-base flex items-center gap-2 text-gray-800">
            <span class="w-1 h-4 rounded-sm bg-blue-500"></span>
            <span data-i18n="character_leaderboard">${titleText}</span>
        </h3>
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest" data-i18n="global_best">${subTitleText}</span>
    `;
    container.appendChild(header);

    // [5] 캐릭터 카드 생성
    sortedHeroes.forEach((hero) => {
        const englishName = hero.english_name;
        const displayName = lang === 'ko' ? hero.korean_name : hero.english_name;
        const fileName = englishName.replace(/\s+/g, '_');
        const imgPath = `./heroes/${fileName}.webp`;

        const modes = [
            { id: 'Classic', label: translations[lang]['fissureSub'] || 'Classic' },
            { id: 'Rift', label: translations[lang]['riftSub'] || 'Rift' },
            { id: 'Battlefield', label: 'Battlefield' },
            { id: 'SK', label: 'SK' }
        ];

        let statsHTML = "";
        modes.forEach(mode => {
            const modeRecords = hero.records.filter(r => 
                r.mode && r.mode.trim().toLowerCase() === mode.id.toLowerCase()
            );
            
            if (modeRecords.length > 0) {
                // 모드별 최고 기록 선별 (오류 수정됨)
                const best = [...modeRecords].sort((a, b) => {
                    const lvA = parseInt(String(a.level || 0).replace(/[^0-9]/g, '')) || 0;
                    const lvB = parseInt(String(b.level || 0).replace(/[^0-9]/g, '')) || 0;
                    if (lvB !== lvA) return lvB - lvA;
                    const stgA = parseInt(a.stage) || 0;
                    const stgB = parseInt(b.stage) || 0;
                    if (stgB !== stgA) return stgB - stgA;
                    // 시간은 문자열 비교 (오름차순)
                    return String(a.time).localeCompare(String(b.time));
                })[0];

                const regionCode = (best.region || 'us').toLowerCase();
                const flagUrl = `https://flagcdn.com/w40/${regionCode}.png`;

                // [레이아웃] 모드 | 국기 닉네임 (상단), 시간 (하단)
                statsHTML += `
                    <div class="flex items-start gap-3 py-2 border-t border-gray-50 first:border-0">
                        <span class="text-[10px] font-black text-gray-400 uppercase w-12 flex-shrink-0 pt-0.5 border-r border-gray-100 pr-1">${mode.label}</span>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5 mb-0.5">
                                <img src="${flagUrl}" class="w-3.5 h-2.5 object-cover rounded-[1px] shadow-sm">
                                <span class="text-[11px] font-bold text-gray-800 truncate">${best.userId}</span>
                            </div>
                            <div class="text-[10px] text-gray-400 font-medium tabular-nums pl-5 italic">${best.time}</div>
                        </div>
                    </div>
                `;
            }
        });

        if (statsHTML === "") {
            statsHTML = `<p class="text-[10px] text-gray-300 italic py-1">No records yet</p>`;
        }

        const card = document.createElement('div');
        card.className = "flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md";

        // 캐릭터별 구도 보정 로직
        let objPos = "center 10%";
        let transform = "scale(1.3)";
        if (englishName === "Yoiko") { objPos = "center 10%"; transform = "scale(1.8) translateX(-5px)"; }
        if (englishName === "Alessia") objPos = "center 40%";
        if (englishName === "Vesper") { objPos = "center 30%"; transform = "scale(1.7)"; }
        if (englishName === "Jadetalon") { objPos = "center -20%"; transform = "scale(2) translateX(10px)"; }
        if (englishName === "Peddler") { objPos = "center 10%"; transform = "scale(1) translateX(5px)"; }

        card.innerHTML = `
            <div class="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 relative">
                <img src="${imgPath}" onerror="this.src='https://via.placeholder.com/64x64?text=Hero'" 
                     class="w-full h-full object-cover" style="object-position: ${objPos}; transform: ${transform};">
            </div>
            <div class="flex-1 min-w-0">
                <div class="mb-2">
                    <span class="font-black text-sm text-gray-900 uppercase tracking-tight">${displayName}</span>
                </div>
                <div class="flex flex-col">
                    ${statsHTML}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
            }
