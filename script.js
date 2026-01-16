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
        time: document.getElementById('resTime').innerText,
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
        console.error("Save Error:", error);
        alert(lang === 'ko' ? "서버 통신 에러가 발생했습니다." : "Server error occurred.");
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
 *//**
* 홈 섹션 내부 서브 탭 전환 (Ranking <-> Guide)
*/
/**
 * 1. 전역 네비게이션 전환 (Home / Rank / Guide)
 */
function switchTab(tab) {
    const sectionHome = document.getElementById('section-home');
    const sectionRank = document.getElementById('section-ranking');
    const sectionGuide = document.getElementById('section-guide');
    const navs = {
        home: document.getElementById('nav-home'),
        rank: document.getElementById('nav-rank'),
        guide: document.getElementById('nav-guide')
    };

    // 모든 섹션 숨기기 & 아이콘 초기화
    [sectionHome, sectionRank, sectionGuide].forEach(el => el?.classList.add('hidden'));
    Object.values(navs).forEach(el => {
        if (el) { el.classList.remove('text-black'); el.classList.add('text-gray-300'); }
    });

    if (tab === 'home') {
        sectionHome.classList.remove('hidden');
        navs.home.classList.replace('text-gray-300', 'text-black');
        switchHomeTab('ranking'); // 홈 복구 시 기본 탭은 랭킹
    } else {
        if (rankingTimeout) { clearTimeout(rankingTimeout); rankingTimeout = null; } // 타이머 정지
        if (tab === 'ranking') { sectionRank.classList.remove('hidden'); navs.rank.classList.replace('text-gray-300', 'text-black'); }
        if (tab === 'guide') { sectionGuide.classList.remove('hidden'); navs.guide.classList.replace('text-gray-300', 'text-black'); }
    }
    window.scrollTo(0, 0);
}

/**
 * 2. 홈 섹션 내부 서브 탭 전환 (Ranking <-> Guide)
 */
function switchHomeTab(subTab) {
    const rCont = document.getElementById('content-ranking');
    const gCont = document.getElementById('content-guide');
    const rTabBtn = document.getElementById('tab-ranking');
    const gTabBtn = document.getElementById('tab-guide');

    if (subTab === 'ranking') {
        rCont.style.display = ''; // 인라인 스타일 제거 (CSS 그리드 적용을 위함)
        rCont.classList.remove('hidden');
        gCont.classList.add('hidden');
        rTabBtn.classList.add('tab-active');
        rTabBtn.classList.remove('text-gray-400', 'font-medium');
        gTabBtn.classList.remove('tab-active');
        gTabBtn.classList.add('text-gray-400', 'font-medium');
        loadRanking();
    } else {
        gCont.style.display = ''; // 인라인 스타일 제거
        gCont.classList.remove('hidden');
        rCont.classList.add('hidden');
        gTabBtn.classList.add('tab-active');
        gTabBtn.classList.remove('text-gray-400', 'font-medium');
        rTabBtn.classList.remove('tab-active');
        rTabBtn.classList.add('text-gray-400', 'font-medium');
        if (rankingTimeout) { clearTimeout(rankingTimeout); rankingTimeout = null; }
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
            imageScale = "scale(1.3)";
        }else if (englishName === "Akaisha") {
            objectPosition = "center 20%"; // 세로 위치만 고정
            imageScale = "scale(1.3)";
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
}
/**
 * OWLOG - 실시간 랭킹 로드 (정렬 로직 포함)
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

        // [핵심] 정렬 로직 적용
        rankingDataCache = rawData.sort((a, b) => {
            const scoreA = Number(a.totalScore);
            const scoreB = Number(b.totalScore);

            // 1. 점수가 다르다면 점수 높은 순(내림차순)
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }
            // 2. 점수가 같다면 시간이 짧은 순(오름차순)
            // "02:45".localeCompare("03:10") -> "02:45"가 앞으로 옴
            return a.time.localeCompare(b.time);
        });

        startRankingRotation();
    } catch (error) {
        console.error("Ranking Load Error:", error);
    }
}