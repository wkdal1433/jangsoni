
    // 화면 전환: 한 번에 한 화면만 보여줌
    const SCREENS = ["intro", "menu", "soon", "law", "koicd", "pubmed", "yakgwan", "cardnews", "fss", "timeline"];
    const TITLES = { intro: "장손이 · 장기손해사정의 똑똑한 AI 파트너", menu: "장기 손해사정 메뉴", soon: "준비 중", law: "장기 손해사정 판례", koicd: "한국표준질병사인분류(KCD)", pubmed: "의학 논문 (PubMed)", yakgwan: "약관", cardnews: "카드뉴스 만들기", fss: "금융감독원 분쟁조정정보", timeline: "사건 타임라인 · 자동 판정" };

    // 분쟁조정: 검색창 (renderFssResult는 분쟁조정 데이터 부분에 있음)
    document.getElementById("fss-form").addEventListener("submit", e => {
      e.preventDefault();
      runFssSearch(document.getElementById("fss-query").value, null);
    });

    // 카드뉴스 양식: 탭 3개(면책안내·고지의무 위반·통지의무 위반) × 세부 유형
    // 한 장에 한 내용 (hookEm은 점 강조할 글자, items는 [이름표, 값], link는 카드 아래 원문 링크)
    // 약관 조항은 표준약관 질병·상해보험(손해보험 회사용) 기준, 판례·분쟁조정은 앞서 확인한 실제 사례
    // '(직접 입력)'은 사건마다 담당자가 채울 칸
    const FSS_LINK = id => ({ label: "분쟁조정사례 보기 (금융감독원)", url: "https://www.fss.or.kr/fss/job/fncCnflCase/view.do?menuNo=201195&caseSlno=" + id });
    const LAW_LINK = q => ({ label: "판례 보기 (국가법령정보센터)", url: "https://www.law.go.kr/precSc.do?menuId=7&query=" + encodeURIComponent(q) });
    const PUBMED_LINK = { label: "논문 찾기 (PubMed)", url: "https://pubmed.ncbi.nlm.nih.gov/" };
    const CN_PAPER_CARD = { hookEm: "의학", hookSub: "적으로는?", title: "의학논문",
      items: [["논문 제목 · 출처", "(직접 입력)"], ["핵심 내용", "(직접 입력)"]], link: PUBMED_LINK };
    // ----- 고지의무·통지의무: 고객에게 보내는 안내용 완성 예시 -----
    // 사건 내용은 설명을 위한 예시이고, 약관 조항(표준약관 질병·상해보험)과 판례·분쟁조정사례는 실제 원문 기준
    const CN_DISCLOSE_INTRO = { hookEm: "고지의무", hookSub: "란?", title: "계약 전 알릴 의무",
      items: [["약관 조항", "계약 전 알릴 의무 (표준약관 제14조)"], ["알릴 내용", "청약서 질문에 알고 계신 사실을 그대로 알려 주셔야 해요"]] };
    const CN_DISCLOSE_LAW = { hookEm: "유사 사례", hookSub: "의 판례는?", title: "판례",
      items: [["사건번호 · 선고일", "대법원 2000다40353 · 2001.01.05"], ["판결 요지", "고혈압을 알리지 않고 지주막하출혈로 사망, 계약 해지 인정"]],
      link: { label: "판례 전문 보기 (국가법령정보센터)", url: "https://www.law.go.kr/precInfoP.do?precSeq=191128" } };
    const CN_DISCLOSE_GUIDE = { hookEm: "이의", hookSub: "가 있으시면?", title: "고객 안내",
      items: [["이의 제기", "반대 증거가 있으면 이의를 제기하실 수 있어요 (제16조④)"], ["분쟁조정", "금융감독원에 분쟁조정을 신청하실 수 있어요"]] };
    const CN_NOTIFY_INTRO = { hookEm: "통지의무", hookSub: "란?", title: "계약 후 알릴 의무",
      items: [["약관 조항", "상해보험계약 후 알릴 의무 (표준약관 제15조)"], ["알릴 내용", "직업·직무, 운전 목적·여부, 이륜차 사용이 바뀌면 바로 알려 주셔야 해요"]] };
    const CN_DISCLOSE_BASE = [CN_DISCLOSE_INTRO];
    const CN_NOTIFY_BASE = [CN_NOTIFY_INTRO];

    const CN_SETS = {
      exempt: { label: "면책안내", subs: {
        "가입전진단": [
          { hookEm: "약관", hookSub: "에는 뭐라고?", title: "약관 내용",
            items: [["담보명", "(직접 입력)"], ["지급사유", "보험기간 중 진단확정 (제3조)"], ["면책 근거", "보장개시 전 진단확정은 제외"]] },
          { hookEm: "결론", hookSub: "은 어떻게?", title: "검토결과",
            items: [["지급 여부", "부지급 (면책)"], ["판단 근거", "가입 전 진단확정·치료 이력 확인"]] },
          { hookEm: "KCD 코드", hookSub: " 부여기준은?", title: "KCD 코드 부여기준",
            items: [["진단명 · KCD 코드", "(직접 입력)"], ["부여 기준", "KOICD 분류표·코딩지침 확인"]] },
          { hookEm: "유사 사례", hookSub: "의 판례는?", title: "판례",
            items: [["사건번호 · 선고일", "대법원 2012다25890 · 2013.10.11"], ["판결 요지", "가입 전 원인·기존 장해의 보장 여부는 약정에 따름"]],
            link: LAW_LINK("2012다25890") },
          CN_PAPER_CARD,
          { hookEm: "분쟁조정", hookSub: "결정은?", title: "분쟁조정결정 내용",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2026.01.09"], ["처리 결과", "부담보 질병을 5년 안에 치료했으면 부담보 해제 안 됨"]],
            link: FSS_LINK(154) }
        ],
        "진단부적정": [
          { hookEm: "약관", hookSub: "에는 뭐라고?", title: "약관 내용",
            items: [["담보명", "(직접 입력)"], ["지급사유", "보험기간 중 진단확정 (제3조)"], ["면책 근거", "진단확정 방법은 특약 기준"]] },
          { hookEm: "결론", hookSub: "은 어떻게?", title: "검토결과",
            items: [["지급 여부", "부지급 (진단 부적정)"], ["판단 근거", "확정검사 없이 선별검사·검사결과만으로 진단"]] },
          { hookEm: "KCD 코드", hookSub: " 부여기준은?", title: "KCD 코드 부여기준",
            items: [["진단명 · KCD 코드", "(직접 입력)"], ["부여 기준", "의사 진단 없이 검사결과만으로 코드 부여 불가 (코딩지침)"]] },
          { hookEm: "유사 사례", hookSub: "의 판례는?", title: "판례",
            items: [["사건번호 · 선고일", "(직접 입력)"], ["판결 요지", "판례 탭의 법제처 최신 검색 결과 확인"]],
            link: LAW_LINK("뇌혈관질환 진단 보험금") },
          CN_PAPER_CARD,
          { hookEm: "분쟁조정", hookSub: "결정은?", title: "분쟁조정결정 내용",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2024.07.11"], ["처리 결과", "객관적 검사 부족 시 진단만으로 단정 못 함, 제3 의료기관 자문 권고"]],
            link: FSS_LINK(54) }
        ]
      } },
      disclose: { label: "고지의무 위반", subs: {
        // 예시: 고혈압 투약을 알리지 않고 가입 → 뇌출혈 진단비 청구
        "면책": [...CN_DISCLOSE_BASE,
          { hookEm: "확인", hookSub: "된 내용은?", title: "확인 내용",
            items: [["청약서 질문", "5년 내 고혈압 진단·투약 여부"], ["확인된 사실", "가입 1년 전부터 고혈압약 복용"], ["청구 내용", "뇌출혈 진단비"]] },
          { hookEm: "처리", hookSub: " 결과는?", title: "처리 결과",
            items: [["처리 결과", "진단비 지급 불가 · 계약 해지"], ["이유", "고혈압이 뇌출혈에 영향 (제16조④)"], ["참고", "회사가 영향을 입증 못하면 지급 (제16조⑥)"]] },
          CN_DISCLOSE_LAW,
          { hookEm: "분쟁조정", hookSub: " 사례는?", title: "분쟁조정사례",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2026.01.09"], ["처리 결과", "설계사에게 말로만 알린 고혈압 치료는 고지로 볼 수 없어 해지 정당"]],
            link: FSS_LINK(148) },
          CN_DISCLOSE_GUIDE
        ],
        // 예시: 건강검진 위 재검 소견을 알리지 않고 가입 → 교통사고 골절 수술비 청구
        "해지": [...CN_DISCLOSE_BASE,
          { hookEm: "확인", hookSub: "된 내용은?", title: "확인 내용",
            items: [["청약서 질문", "3개월 내 건강검진 이상 소견 여부"], ["확인된 사실", "가입 2개월 전 위 재검 소견"], ["청구 내용", "교통사고 골절 수술비"]] },
          { hookEm: "처리", hookSub: " 결과는?", title: "처리 결과",
            items: [["처리 결과", "수술비는 지급 · 계약은 해지"], ["이유", "위 질환과 골절은 관계없음 (제16조⑥)"], ["해지 시", "해약환급금 지급 (제16조③)"]] },
          CN_DISCLOSE_LAW,
          { hookEm: "분쟁조정", hookSub: " 사례는?", title: "분쟁조정사례",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2024.07.05"], ["처리 결과", "가입 전 3개월 내 건강검진 이상 소견도 알려야 할 사항, 해지 정당"]],
            link: FSS_LINK(9) },
          CN_DISCLOSE_GUIDE
        ],
        // 예시: 허리디스크 입원을 알리지 않고 가입 → 발목 골절 수술비 청구, 해지 대신 조건 변경으로 유지
        "계약변경": [...CN_DISCLOSE_BASE,
          { hookEm: "확인", hookSub: "된 내용은?", title: "확인 내용",
            items: [["청약서 질문", "5년 내 입원·수술 여부"], ["확인된 사실", "가입 3년 전 허리디스크로 입원"], ["청구 내용", "발목 골절 수술비"]] },
          { hookEm: "처리", hookSub: " 결과는?", title: "처리 결과",
            items: [["처리 결과", "수술비 지급 · 허리 부담보로 유지"], ["이유", "해지 대신 고객님 동의로 조건 변경"], ["부담보 해제", "5년간 추가 치료 없으면 보장 (제18조⑤)"]] },
          CN_DISCLOSE_LAW,
          { hookEm: "분쟁조정", hookSub: " 사례는?", title: "분쟁조정사례",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2026.01.09"], ["처리 결과", "부담보 질병을 5년 안에 다시 치료했다면 부담보가 풀리지 않아요"]],
            link: FSS_LINK(154) },
          CN_DISCLOSE_GUIDE
        ]
      } },
      notify: { label: "통지의무 위반", subs: {
        // 예시: 사무직으로 가입 후 택배 배송기사로 바뀌었는데 알리지 않음 → 배송 중 사고
        "비례보상": [...CN_NOTIFY_BASE,
          { hookEm: "직업", hookSub: " 변경 확인", title: "직업 확인",
            items: [["가입 때 알린 직업", "사무직"], ["사고 당시 직업", "택배 배송기사 (화물차 운전)"], ["사고 내용", "배송 중 교통사고로 골절"]] },
          { hookEm: "처리", hookSub: " 결과는?", title: "처리 결과",
            items: [["처리 결과", "보험금 일부 삭감 지급"], ["계산 방법", "변경 전 ÷ 변경 후 요율 (제15조④⑤)"], ["계산 예시", "0.5 ÷ 1.0 → 보험금 50% (예시)"]] },
          { hookEm: "분쟁조정", hookSub: " 사례는?", title: "분쟁조정사례",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2024.07.11"], ["처리 결과", "학생이라도 위험한 일에 취업했다면 알려야 하고, 삭감 지급 정당"]],
            link: FSS_LINK(39) },
          { hookEm: "직업이", hookSub: " 바뀌면?", title: "고객 안내",
            items: [["알리는 방법", "우편·전화·방문으로 바로 (제15조①)"], ["알려 주시면", "보험료 조정 후 계속 보장"], ["참고", "직업과 무관한 사고는 전액 지급"]] }
        ],
        // 예시: 사무직 → 택배 배송기사로 바뀌어 고객이 직접 알림
        "직업변경 요청": [...CN_NOTIFY_BASE,
          { hookEm: "직업", hookSub: " 변경 확인", title: "직업 확인",
            items: [["가입 때 알린 직업", "사무직"], ["변경된 직업", "택배 배송기사 (화물차 운전)"], ["요청 내용", "직업 변경 통지 · 계약 변경"]] },
          { hookEm: "처리", hookSub: " 결과는?", title: "처리 결과",
            items: [["처리 결과", "계약내용 변경 (제15조②)"], ["보험료", "위험 증가로 인상 · 정산금 납입"], ["납입 방법", "일시납 또는 분납 선택 (제15조③)"]] },
          { hookEm: "분쟁조정", hookSub: " 사례는?", title: "분쟁조정사례",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2026.01.09"], ["처리 결과", "가입 뒤 직업이 실제로 바뀐 적이 없다면 통지의무 위반이 아니에요"]],
            link: FSS_LINK(150) },
          { hookEm: "알려 주셔서", hookSub: " 감사합니다", title: "고객 안내",
            items: [["앞으로는", "변경된 직업 기준으로 계속 보장받으세요"], ["알리지 않으면", "사고 때 보험금이 줄어들 수 있어요 (제15조④⑤)"]] }
        ]
      } }
    };
    let cnTab = "exempt";
    let cnSub = "가입전진단";
    let CARD_NEWS = CN_SETS[cnTab].subs[cnSub];

    // 탭·세부 유형 버튼 만들기
    function renderCnTabs() {
      const tabs = document.getElementById("cn-tabs");
      const subs = document.getElementById("cn-subs");
      tabs.innerHTML = ""; subs.innerHTML = "";
      Object.entries(CN_SETS).forEach(([key, set]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "tab" + (key === cnTab ? " active" : "");
        b.textContent = set.label;
        // 탭을 다시 열면 그 탭에서 마지막으로 본 세부 유형으로
        b.addEventListener("click", () => switchCardNews(key, cnLastSub[key] || Object.keys(set.subs)[0]));
        tabs.appendChild(b);
      });
      Object.keys(CN_SETS[cnTab].subs).forEach(sub => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "filter" + (sub === cnSub ? " active" : "");
        b.textContent = sub;
        b.addEventListener("click", () => switchCardNews(cnTab, sub));
        subs.appendChild(b);
      });
      document.getElementById("cn-save-all").textContent = CARD_NEWS.length + "장 모두 이미지(PNG)로 저장";
    }
    const cnLastSub = {};
    let lastExemptSub = cnSub;
    function switchCardNews(tab, sub) {
      cnTab = tab; cnSub = sub;
      cnLastSub[tab] = sub;
      if (tab === "exempt") lastExemptSub = sub;
      CARD_NEWS = CN_SETS[tab].subs[sub];
      renderCnTabs();
      renderCardNews();
    }

    function renderCardNews() {
      const list = document.getElementById("cn-list");
      list.innerHTML = "";
      CARD_NEWS.forEach((c, i) => {
        const next = CARD_NEWS[i + 1];
        const card = document.createElement("article");
        // 항목이 3개인 장은 글자를 조금 줄여 칸 안에 들어가게
        card.className = "cn-card" + (c.items.length >= 3 ? " dense" : "");
        card.innerHTML =
          '<div class="cn-top">' +
            '<div class="cn-logo"><span class="h-mark">H</span>현대해상</div>' +
            '<div class="cn-meta">' +
              '<div><span class="cn-meta-label">상품명</span><span class="cn-meta-value" contenteditable="true" data-meta="product" data-placeholder="입력"></span></div>' +
              '<div><span class="cn-meta-label">계약번호</span><span class="cn-meta-value" contenteditable="true" data-meta="contract" data-placeholder="입력"></span></div>' +
              '<div><span class="cn-meta-label">사고번호</span><span class="cn-meta-value" contenteditable="true" data-meta="claim" data-placeholder="입력"></span></div>' +
            '</div>' +
          '</div>' +
          '<div class="cn-board">' +
            '<div class="cn-clip">H</div>' +
            '<div class="cn-paper">' +
              '<div class="cn-hook"><em contenteditable="true"></em><span class="sub" contenteditable="true"></span></div>' +
              '<div class="cn-items"></div>' +
            '</div>' +
          '</div>' +
          '<div class="cn-bottom" contenteditable="true"></div>';

        // 글자는 textContent로 넣어 그대로 표시
        card.querySelector(".cn-hook em").textContent = c.hookEm;
        card.querySelector(".cn-hook .sub").textContent = c.hookSub;
        card.querySelector(".cn-bottom").textContent = next ? "다음 장: " + next.title + " ›" : "처음부터 다시 보기 ›";

        const itemsEl = card.querySelector(".cn-items");
        c.items.forEach(([head, desc]) => {
          const row = document.createElement("div");
          row.className = "cn-item";
          row.innerHTML = '<span class="cn-check">✓</span><div class="cn-item-text"><b contenteditable="true"></b><span contenteditable="true"></span></div>';
          row.querySelector("b").textContent = head;
          row.querySelector(".cn-item-text span").textContent = desc;
          itemsEl.appendChild(row);
        });

        // 카드 아래에 '이 장 저장' 버튼
        const wrap = document.createElement("div");
        wrap.className = "cn-wrap";
        const btn = document.createElement("button");
        btn.className = "cn-btn";
        btn.type = "button";
        btn.textContent = (i + 1) + "장 이미지(PNG)로 저장";
        btn.addEventListener("click", () => saveCards([card]));

        // 카드 아래 줄: 왼쪽은 원문 링크(판례·논문·분쟁조정), 오른쪽은 저장 버튼
        const foot = document.createElement("div");
        foot.className = "cn-foot";
        const linkBox = document.createElement("div");
        linkBox.className = "cn-link";
        if (c.link) {
          const a = document.createElement("a");
          a.target = "_blank";
          a.rel = "noopener";
          a.href = c.link.url;
          a.textContent = "🔗 " + c.link.label;
          const input = document.createElement("input");
          input.className = "cn-link-url";
          input.type = "url";
          input.value = c.link.url;
          input.setAttribute("aria-label", c.title + " 링크 주소");
          input.title = "다른 자료로 바꾸려면 주소를 붙여넣으세요";
          input.addEventListener("input", () => { a.href = input.value.trim() || c.link.url; });
          linkBox.appendChild(a);
          linkBox.appendChild(input);
        }
        foot.appendChild(linkBox);
        foot.appendChild(btn);

        wrap.appendChild(card);
        wrap.appendChild(foot);
        list.appendChild(wrap);
      });
      loadCardNews();
    }

    // ----- 고친 내용 저장 (이 브라우저에만 저장) -----
    // 저장은 탭·세부 유형마다 따로 (예: cardnews_v3_notify_비례보상)
    const cnStorageKey = () => "cardnews_v4_" + cnTab + "_" + cnSub;
    const cnStatus = document.getElementById("cn-status");

    function cardFields(card) {
      return [...card.querySelectorAll('[contenteditable="true"]')];
    }

    function saveCardNews() {
      // 장마다 { 글자들, 링크 주소 } 저장
      const data = [...document.querySelectorAll(".cn-card")].map(card => {
        const urlInput = card.parentElement.querySelector(".cn-link-url");
        return { fields: cardFields(card).map(el => el.textContent), url: urlInput ? urlInput.value : null };
      });
      try {
        localStorage.setItem(cnStorageKey(), JSON.stringify(data));
        cnStatus.textContent = "저장됨 " + new Date().toLocaleTimeString("ko-KR");
      } catch (e) {
        cnStatus.textContent = "이 브라우저에서는 저장할 수 없어요.";
      }
    }

    function loadCardNews() {
      let data = null;
      try { data = JSON.parse(localStorage.getItem(cnStorageKey())); } catch (e) { data = null; }
      if (!Array.isArray(data)) return;
      document.querySelectorAll(".cn-card").forEach((card, i) => {
        const saved = data[i];
        if (!saved || !Array.isArray(saved.fields)) return;
        const fields = cardFields(card);
        // 양식의 칸 수가 바뀌었으면 그 장은 불러오지 않음
        if (saved.fields.length !== fields.length) return;
        fields.forEach((el, k) => { el.textContent = saved.fields[k]; });
        const urlInput = card.parentElement.querySelector(".cn-link-url");
        if (urlInput && saved.url) {
          urlInput.value = saved.url;
          urlInput.dispatchEvent(new Event("input"));
        }
      });
      cnStatus.textContent = "저장된 내용을 불러왔어요.";
    }

    // 상품명·계약번호·사고번호 칸은 한 줄만 (Enter로 줄바꿈 안 됨)
    document.getElementById("cn-list").addEventListener("keydown", e => {
      if (e.key === "Enter" && e.target.classList && e.target.classList.contains("cn-meta-value")) e.preventDefault();
    });

    let cnSaveTimer = null;
    document.getElementById("cn-list").addEventListener("input", e => {
      // 상품명·계약번호·사고번호는 6장 모두 같은 값으로 맞춤
      const meta = e.target.dataset && e.target.dataset.meta;
      if (meta) {
        document.querySelectorAll('.cn-meta-value[data-meta="' + meta + '"]').forEach(el => {
          if (el !== e.target) el.textContent = e.target.textContent;
        });
      }
      clearTimeout(cnSaveTimer);
      cnSaveTimer = setTimeout(saveCardNews, 400);
    });

    // 되돌리기: 확인 단계를 버튼 안에서 처리 (두 번 눌러야 실행)
    const cnResetBtn = document.getElementById("cn-reset");
    let cnResetArmed = false;
    cnResetBtn.addEventListener("click", () => {
      if (!cnResetArmed) {
        cnResetArmed = true;
        cnResetBtn.textContent = "한 번 더 누르면 되돌려요";
        setTimeout(() => { cnResetArmed = false; cnResetBtn.textContent = "처음 양식으로 되돌리기"; }, 3000);
        return;
      }
      cnResetArmed = false;
      cnResetBtn.textContent = "처음 양식으로 되돌리기";
      try { localStorage.removeItem(cnStorageKey()); } catch (e) {}
      renderCardNews();
      cnStatus.textContent = "처음 양식으로 되돌렸어요.";
    });

    // ----- 이미지(PNG) 저장 -----
    // html2canvas는 필요할 때만 인터넷에서 불러옴 (평소에는 인터넷 없이도 화면이 열리게)
    function loadHtml2Canvas() {
      if (window.html2canvas) return Promise.resolve(window.html2canvas);
      return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        s.onload = () => resolve(window.html2canvas);
        s.onerror = () => reject(new Error("load failed"));
        document.head.appendChild(s);
      });
    }

    async function saveCards(cards) {
      const buttons = document.querySelectorAll("#cardnews .cn-btn");
      buttons.forEach(b => b.disabled = true);
      if (document.activeElement) document.activeElement.blur();
      try {
        const h2c = await loadHtml2Canvas();
        const all = [...document.querySelectorAll(".cn-card")];
        for (const card of cards) {
          const no = all.indexOf(card) + 1;
          cnStatus.textContent = no + "장 이미지 만드는 중...";
          // 결과 이미지를 가로 1080px로 맞춤
          card.classList.add("cn-capturing");
          let canvas;
          try {
            canvas = await h2c(card, { scale: 1080 / card.offsetWidth, backgroundColor: null, logging: false });
          } finally {
            card.classList.remove("cn-capturing");
          }
          const a = document.createElement("a");
          a.href = canvas.toDataURL("image/png");
          a.download = "카드뉴스_" + no + "_" + CARD_NEWS[no - 1].title.replace(/\s+/g, "") + ".png";
          document.body.appendChild(a);
          a.click();
          a.remove();
          await new Promise(r => setTimeout(r, 400));
        }
        cnStatus.textContent = cards.length + "장 저장했어요. 다운로드 폴더를 확인해 주세요.";
      } catch (e) {
        cnStatus.textContent = "이미지를 만들지 못했어요. 인터넷 연결을 확인해 주세요.";
      } finally {
        buttons.forEach(b => b.disabled = false);
      }
    }

    document.getElementById("cn-save-all").addEventListener("click", () => {
      saveCards([...document.querySelectorAll(".cn-card")]);
    });

    renderCnTabs();
    renderCardNews();

    // PubMed 검색: 검색어로 PubMed 결과 페이지를 새 창에서 엶
    document.getElementById("pubmed-form").addEventListener("submit", e => {
      e.preventDefault();
      const q = document.getElementById("pubmed-query").value.trim();
      const url = q
        ? "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(q)
        : "https://pubmed.ncbi.nlm.nih.gov/";
      window.open(url, "_blank", "noopener");
    });
    function showScreen(id) {
      SCREENS.forEach(s => { document.getElementById(s).hidden = s !== id; });
      // 판례 탭에 들어올 때마다 법제처에서 새로 검색
      if (id === "law") refreshLiveLaw();
      // 약관(현대해상) 페이지도 처음 열 때 한 번만 불러옴
      document.title = TITLES[id];
      window.scrollTo(0, 0);
    }

    // KOICD 찾기: 아래에 분류·코딩지침·코딩사례 표시 (showKoicd는 KOICD 데이터 부분에 있음)
    document.getElementById("koicd-form").addEventListener("submit", e => {
      e.preventDefault();
      showKoicd(document.getElementById("koicd-query").value);
    });

    let analyzedCaseKey = "";
    function prepareCaseAnalysis() {
      // 상품 약관을 불러온 뒤에는 약관에 있는 담보만 받음
      if (!introValidateCover()) {
        const input = document.getElementById("in-cover");
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
      runAutoSearch();
      analyzedCaseKey = JSON.stringify(readCaseInput());
      return true;
    }

    // 시작하기 → 입력값으로 자동검색 후 메뉴 화면
    document.getElementById("start").addEventListener("click", () => {
      if (prepareCaseAnalysis()) Jangsoni.navigate("menu");
    });

    // 메뉴 버튼과 뒤로 가기 버튼 (data-go에 적힌 화면으로 이동)
    document.querySelectorAll("[data-go]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.name) {
          document.getElementById("soon-title").textContent = btn.dataset.name;
        }
        Jangsoni.navigate(btn.dataset.go, btn.dataset.scrollTarget);
      });
    });

    // 판례 데이터 (법제처 검색 결과의 사건번호·선고일을 그대로 사용)
    const CASES = [
      {
        title: "운전 중 급성 심근경색으로 사망",
        category: "상해사망",
        type: "외래성",
        summary: "승용차를 운전하다 급성 심근경색으로 사망한 사건이에요. 대법원은 질병이 갑자기 나타난 것이라 '우발적인 외래의 사고'인 재해가 아니라고 봤어요. 교통재해사망보험금은 지급되지 않았어요.",
        caseNo: "2007다67920",
        date: "2007.12.13"
      },
      {
        title: "돌을 옮기다 쓰러져 사망",
        category: "상해사망",
        type: "외래성",
        summary: "과수원에서 돌을 옮기다 갑자기 쓰러져 사망한 사건이에요. 대법원은 일하다 쓰러졌다는 사실만으로는 외래의 사고라고 단정할 수 없다고 봤어요. 외래성은 보험금을 청구하는 쪽이 증명해야 해요.",
        caseNo: "2001다27579",
        date: "2001.08.21"
      },
      {
        title: "에어컨을 켜고 자다 사망",
        category: "상해사망",
        type: "외래성",
        summary: "원룸에서 에어컨을 켜고 자다 사망한 사건이에요. 대법원은 에어컨 때문에 저체온증으로 사망했다는 인과관계를 인정하지 않았어요. 유족이 부검을 거부해서 생긴 불이익은 유족이 부담한다고 했어요.",
        caseNo: "2010다12241",
        date: "2010.09.30"
      },
      {
        title: "요양병원 식사 중 사망 (질식 vs 심근경색)",
        category: "상해사망",
        type: "외래성",
        summary: "요양병원에서 식사 중 의식을 잃고 사망한 사건이에요. 사인 감정이 질식과 급성 심근경색으로 갈렸어요. 대법원은 감정을 보완하지 않고 질식(외래 사고)으로 인정한 원심이 잘못이라고 했어요.",
        caseNo: "2022다303216",
        date: "2023.04.27"
      },
      {
        title: "사고 후 사망, 실제 원인은 고혈압성 지주막하출혈",
        category: "상해사망",
        type: "외래성",
        summary: "사고 직후 사망했지만, 직접 원인은 지병인 고혈압으로 생긴 지주막하출혈로 판단했어요. 고혈압을 알리지 않은 고지의무 위반을 이유로 한 보험계약 해지도 인정됐어요.",
        caseNo: "2000다40353",
        date: "2001.01.05"
      },
      {
        title: "자살은 재해사망특약의 재해가 아님",
        category: "상해사망",
        type: "우연성",
        summary: "자살은 우연히 일어난 사고가 아니어서 재해사망특약이 보장하는 재해에 해당하지 않아요. 주계약의 자살 면책 예외 조항도 재해사망특약에는 적용되지 않는다고 봤어요.",
        caseNo: "2008다81633",
        date: "2009.05.28"
      },

      // 장해
      {
        title: "장해진단 다음 날 사망, 장해연금은 안 됨",
        category: "장해",
        issue: "장해 고정 여부",
        summary: "교통사고로 식물인간 상태였다가 후유장해진단을 받은 다음 날 사망한 사건이에요. 사망으로 가는 중에 거친 일시적 상태는 증상이 고정된 '장해'가 아니라고 봤어요. 장해연금을 인정한 원심을 파기했어요.",
        caseNo: "2008다13968",
        date: "2008.06.26"
      },
      {
        title: "팔 절단 후 뇌출혈로 사망, 장해금도 따로 지급",
        category: "장해",
        issue: "장해·사망 중복 지급",
        summary: "교통사고로 팔이 절단되고 외상성 뇌출혈로 사망한 사건이에요. 약관에 중복 지급 규정이 있었고, 팔 절단은 사망과 관련 없이 이미 고정된 장해라고 봤어요. 사망공제금과 별도로 장해공제금도 받을 수 있다고 했어요.",
        caseNo: "2021다284462",
        date: "2022.03.17"
      },
      {
        title: "가입 전부터 있던 장해, 보장 여부는 약정에 따름",
        category: "장해",
        issue: "기왕장해",
        summary: "보험 가입 전에 이미 손가락 장해가 있던 사람이 사고로 장해가 생긴 사건이에요. 가입 전 원인이나 이미 있던 장해를 보장할지는 보험사와 계약자의 약정으로 정한다고 봤어요.",
        caseNo: "2012다25890",
        date: "2013.10.11"
      },
      {
        title: "자살 시도로 1급 장해, 재해장해연금은 아님",
        category: "장해",
        issue: "재해 해당 여부",
        summary: "자살을 시도하다 1급 장해가 된 사건이에요. 고의로 자신을 해친 것은 재해가 아니어서 재해장해연금 대상이 아니라고 봤어요. 재해가 아닌 원인에 따른 공제금(유족위로금)만 받을 수 있다고 했어요.",
        caseNo: "2010다45777",
        date: "2010.11.25"
      },
      {
        title: "페인트칠 중 뇌교출혈, 재해장해 아님",
        category: "장해",
        issue: "재해 해당 여부",
        summary: "페인트칠을 하다 뇌교출혈로 영구장해가 생긴 사건이에요. 출혈은 시너 흡입이 아니라 평소 고혈압 때문으로 봤어요. 약관상 뇌출혈(I61)은 재해에서 빠져 재해장해 보험금 대상이 아니라고 했어요.",
        caseNo: "2000다25965",
        date: "2001.07.24"
      },

      // 뇌혈관질환
      {
        title: "뇌경색 장기 입원, 입원일당 반환",
        category: "뇌혈관질환",
        issue: "입원 필요성",
        summary: "뇌경색으로 3년 넘게 입원하며 2대질병입원일당을 받은 사건이에요. 입원이 치료에 꼭 필요했다고 보기 어려워 보험금을 돌려줘야 한다고 했어요. 보험사가 심사 때 못 걸러냈어도 반환 의무는 그대로예요.",
        caseNo: "2015다7626",
        date: "2017.09.26"
      },
      {
        title: "고혈압성 지주막하출혈 사망, 고지의무 위반 해지",
        category: "뇌혈관질환",
        issue: "고지의무",
        summary: "사망 원인을 지병인 고혈압으로 생긴 지주막하출혈로 판단했어요. 보험사 건강검진센터에서 고혈압이 확인됐어도 보험 심사 부서가 알 수 없었다면 보험사가 알았다고 볼 수 없다고 했어요. 고지의무 위반을 이유로 한 해지가 인정됐어요.",
        caseNo: "2000다40353",
        date: "2001.01.05"
      },
      {
        title: "뇌교출혈(I61)은 재해 아님",
        category: "뇌혈관질환",
        issue: "재해 해당 여부",
        summary: "작업 중 생긴 뇌교출혈이 고혈압 때문에 저절로 생긴 출혈로 보인다고 판단했어요. 약관상 질병코드(I61)로 분류되는 뇌출혈은 재해에서 빠진다고 봤어요. 재해 보험금을 인정한 원심을 파기했어요.",
        caseNo: "2000다25965",
        date: "2001.07.24"
      },

      // 심혈관질환
      {
        title: "운전 중 급성 심근경색, 교통재해 아님",
        category: "심혈관질환",
        issue: "재해 해당 여부",
        summary: "운전 중 급성 심근경색으로 사망했지만, 질병이 갑자기 나타난 것이라 재해가 아니라고 봤어요. 교통재해사망보험금은 지급되지 않았어요.",
        caseNo: "2007다67920",
        date: "2007.12.13"
      },
      {
        title: "운전 중 심장마비, 외래 사고인지 따져야",
        category: "심혈관질환",
        issue: "재해 해당 여부",
        summary: "운전 중 심장마비로 사망한 사건이에요. 교통재해도 '우발적인 외래의 사고'여야 보험금이 나간다고 봤어요. 이를 따지지 않고 보험금을 인정한 원심을 파기했어요.",
        caseNo: "2009다51318",
        date: "2010.09.30"
      },
      {
        title: "사인 감정이 질식과 심근경색으로 엇갈림",
        category: "심혈관질환",
        issue: "사망 원인 감정",
        summary: "요양병원 식사 중 사망했는데, 사인 감정이 질식과 급성 심근경색으로 갈렸어요. 감정을 보완하지 않고 질식으로 인정해 상해사망보험금을 준 원심을 파기했어요.",
        caseNo: "2022다303216",
        date: "2023.04.27"
      },
      {
        title: "심장병이 있어도 외부 요인이 주원인이면 상해",
        category: "심혈관질환",
        issue: "질병과 외래 사고",
        summary: "가벼운 심장질환이 있던 사람이 술에 취해 고온의 밀폐된 차 안에서 자다 사망한 사건이에요. 대법원은 주된 사망 원인이 외부 요인이라 상해사고에 해당한다고 봤어요. 보험금 청구를 받아들이지 않은 원심을 파기했어요.",
        caseNo: "2018다228356",
        date: "2018.08.30"
      },
      {
        title: "검안의 '심근경색' 소견에도 음주 사고로 인정",
        category: "심혈관질환",
        issue: "질병과 외래 사고",
        summary: "술에 취해 귀가한 뒤 숨진 채 발견된 사건이에요. 검안의는 심근경색으로 봤지만, 심장·뇌혈관 질환이 없었고 넘어져 다쳤을 가능성이 커서 외래의 사고로 인정했어요. 공제금 지급이 확정됐어요.",
        caseNo: "2013다63776",
        date: "2014.06.12"
      },

      // 암
      {
        title: "병리상 양성 종양이면 암 진단 아님",
        category: "암",
        issue: "진단확정(병리)",
        summary: "임상적으로는 악성에 가까웠지만 조직검사에서는 양성으로 나온 종양 사건이에요. 약관은 병리 전문의의 조직검사로 암을 확정하게 되어 있어서 암보험금 대상이 아니라고 봤어요. 보험사 승소가 확정됐어요.",
        caseNo: "2018다203395",
        date: "2018.06.28"
      },
      {
        title: "직장 유암종(D37.5 vs C20)은 암에 해당",
        category: "암",
        issue: "암 분류(KCD)",
        summary: "1cm 미만 직장 용종을 떼어 냈고, 진단서에 D37.5와 C20이 엇갈려 적힌 사건이에요. 약관의 '암' 뜻이 분명하지 않으면 고객에게 유리하게 해석해야 한다고 했어요. 직장 유암종을 암으로 인정했어요.",
        caseNo: "2017다285109",
        date: "2018.07.24"
      },
      {
        title: "간이식 후 합병증 수술은 암 수술비 대상 아님",
        category: "암",
        issue: "암 직접치료",
        summary: "간암으로 간이식을 받은 뒤 생긴 담도 협착을 넓히는 시술을 반복한 사건이에요. 이미 암이 없는 상태에서 합병증을 치료한 것이라 '암의 치료를 직접 목적으로 하는 수술'이 아니라고 봤어요. 수술비 부지급이 확정됐어요.",
        caseNo: "2010다40543",
        date: "2010.09.30"
      },
      {
        title: "원발부위 기준 조항은 설명해야 하는 중요 내용",
        category: "암",
        issue: "설명의무(원발부위)",
        summary: "갑상선암(C73)과 림프절 전이(C77.9)를 진단받았는데, 보험사가 원발부위 기준으로 갑상선암 보험금만 준 사건이에요. 원발부위 기준 조항은 보험금과 직결되는 중요한 내용이라 보험사가 설명해야 한다고 봤어요. 청구를 기각한 원심을 파기했어요.",
        caseNo: "2023다250746",
        date: "2025.03.13"
      },
      {
        title: "일반암 보험금을 받았다면 갑상선암 추가 지급 없음",
        category: "암",
        issue: "원발부위·중복 지급",
        summary: "갑상선암(C73)과 림프절 전이(C77.0) 진단으로 보험사가 고액 일반암 보험금을 이미 준 사건이에요. 설명의무를 위반했더라도 일반암 기준으로 지급하면 충분하다고 봤어요. 갑상선암 보험금을 따로 더 달라는 청구는 기각됐어요.",
        caseNo: "2023다274056",
        date: "2025.05.15"
      },
      {
        title: "예방 목적을 겸한 난소 절제도 치료 목적",
        category: "암",
        issue: "치료 목적 수술",
        summary: "자궁적출과 함께 양쪽 난소를 절제했는데, 보험사가 난소암 예방 목적이라며 납입면제를 거절한 사건이에요. 의사가 현장에서 치료 목적을 겸해 판단했다면 예방 목적이 섞였어도 보험사고로 본다고 했어요. 납입면제가 인정됐어요.",
        caseNo: "2021다234368",
        date: "2021.09.09"
      }
    ];

    const searchInput = document.getElementById("search");
    const cardsEl = document.getElementById("cards");
    const countEl = document.getElementById("count");
    const filterButtons = document.querySelectorAll("#type-filters .filter");
    const tabButtons = document.querySelectorAll(".tab[data-category]");
    let currentCategory = "상해사망";
    let currentType = "전체";

    function render() {
      // 급격성·우연성·외래성 버튼과 안내문은 상해사망 탭에서만 보여줌
      const isInjury = currentCategory === "상해사망";
      document.getElementById("type-filters").hidden = !isInjury;
      document.getElementById("note-injury").hidden = !isInjury;

      const keyword = searchInput.value.trim().toLowerCase();
      const list = CASES.filter(c => {
        if (c.category !== currentCategory) return false;
        const typeOk = !isInjury || currentType === "전체" || c.type === currentType;
        const text = [c.title, c.summary, c.caseNo, c.date, c.type, c.issue].filter(Boolean).join(" ").toLowerCase();
        return typeOk && (keyword === "" || text.includes(keyword));
      });

      countEl.textContent = "판례 " + list.length + "건";
      cardsEl.innerHTML = "";

      if (list.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        if (!CASES.some(c => c.category === currentCategory)) {
          empty.textContent = currentCategory + " 판례는 아직 등록되지 않았어요.";
        } else if (isInjury && currentType === "급격성") {
          empty.textContent = "급격성 결여로 상해사고가 인정되지 않은 판례는 법제처 검색에서 찾지 못했어요.";
        } else {
          empty.textContent = "조건에 맞는 판례가 없어요.";
        }
        cardsEl.appendChild(empty);
        return;
      }

      list.forEach(c => {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML =
          '<h2></h2>' +
          '<span class="type"></span>' +
          '<p class="summary"></p>' +
          '<div class="meta"></div>';
        card.querySelector("h2").textContent = c.title;
        const typeEl = card.querySelector(".type");
        // 상해사망은 사고 유형(○○성 결여), 다른 탭은 쟁점을 표시
        if (c.category === "상해사망") {
          typeEl.textContent = c.type + " 결여";
          typeEl.classList.add("type-" + c.type);
        } else {
          typeEl.textContent = c.issue;
          typeEl.classList.add("type-쟁점");
        }
        card.querySelector(".summary").textContent = c.summary;
        card.querySelector(".meta").textContent = "사건번호 " + c.caseNo + " · 선고일 " + c.date;
        cardsEl.appendChild(card);
      });
    }

    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentType = btn.dataset.type;
        render();
      });
    });
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.category;
        // 탭을 바꾸면 사고 유형 버튼은 '전체'로 되돌림
        currentType = "전체";
        filterButtons.forEach(b => b.classList.toggle("active", b.dataset.type === "전체"));
        render();
      });
    });
    searchInput.addEventListener("input", render);

    render();

    // ===== 판례 탭: 법제처(국가법령정보센터) 실시간 판례 검색 =====
    const LAW_CAT_QUERY = { "상해사망": "상해사망 보험금", "장해": "후유장해 보험금", "뇌혈관질환": "뇌혈관질환 보험금", "암": "암 진단 보험금", "심혈관질환": "심근경색 보험금" };
    let liveLawQuery = "";   // 비어 있으면 지금 판례 분류의 기본 검색어 사용
    function refreshLiveLaw() {
      const q = liveLawQuery || LAW_CAT_QUERY[currentCategory] || "보험금";
      const url = "https://www.law.go.kr/precSc.do?menuId=7&query=" + encodeURIComponent(q);
      document.getElementById("live-law-query").value = q;
      // 같은 주소라도 다시 불러오도록 시각을 붙임
      // 내장 판례 검색을 갱신해도 앱 화면의 방문 기록은 추가하지 않는다.
      document.getElementById("live-law-frame").contentWindow.location.replace(url + "&_t=" + Date.now());
      document.getElementById("live-law-newtab").href = url;
      document.getElementById("live-law-time").textContent = new Date().toLocaleTimeString("ko-KR") + " 검색";
    }
    document.getElementById("live-law-form").addEventListener("submit", e => {
      e.preventDefault();
      liveLawQuery = document.getElementById("live-law-query").value.trim();
      refreshLiveLaw();
    });
    // 판례 분류 탭을 바꾸면 그 분류의 검색어로 다시 검색
    tabButtons.forEach(btn => btn.addEventListener("click", () => { liveLawQuery = ""; refreshLiveLaw(); }));

    // ===== 처음 화면 입력값으로 각 메뉴 자동검색 =====

    // 판례·PubMed·금감원 검색에 쓰는 진단코드 정보 (cat: 판례 탭, en: PubMed 영어 검색어, kw: 금감원 검색어)
    const KCD = {
      "I60":   { name: "거미막하출혈", cat: "뇌혈관질환", en: "subarachnoid hemorrhage", kw: "거미막하출혈" },
      "I61":   { name: "뇌내출혈", cat: "뇌혈관질환", en: "intracerebral hemorrhage", kw: "뇌출혈" },
      "I62":   { name: "기타 비외상성 두개내출혈", cat: "뇌혈관질환", en: "nontraumatic intracranial hemorrhage", kw: "뇌출혈" },
      "I63":   { name: "뇌경색증", cat: "뇌혈관질환", en: "cerebral infarction", kw: "뇌경색" },
      "I64":   { name: "출혈 또는 경색증으로 명시되지 않은 뇌졸중", cat: "뇌혈관질환", en: "stroke", kw: "뇌졸중" },
      "I65":   { name: "뇌경색증을 유발하지 않은 뇌전동맥의 폐쇄 및 협착", cat: "뇌혈관질환", en: "carotid artery stenosis", kw: "협착" },
      "I66":   { name: "뇌경색증을 유발하지 않은 대뇌동맥의 폐쇄 및 협착", cat: "뇌혈관질환", en: "cerebral artery stenosis", kw: "협착" },
      "I67.1": { name: "파열되지 않은 대뇌동맥류", cat: "뇌혈관질환", en: "unruptured intracranial aneurysm", kw: "동맥류" },
      "I67.5": { name: "모야모야병", cat: "뇌혈관질환", en: "moyamoya disease", kw: "모야모야" },
      "I20":   { name: "협심증", cat: "심혈관질환", en: "angina pectoris", kw: "협심증" },
      "I21":   { name: "급성 심근경색증", cat: "심혈관질환", en: "acute myocardial infarction", kw: "심근경색" },
      "C73":   { name: "갑상선의 악성 신생물", cat: "암", en: "thyroid cancer", kw: "갑상선암" },
      "C77":   { name: "림프절의 이차성 및 상세불명의 악성 신생물", cat: "암", en: "lymph node metastasis", kw: "림프절" },
      "C20":   { name: "직장의 악성 신생물", cat: "암", en: "rectal cancer", kw: "직장암" },
      "D37.5": { name: "직장의 행동양식 불명 또는 미상의 신생물", cat: "암", en: "rectal neuroendocrine tumor", kw: "유암종" }
    };

    // ===== KOICD 탭: KCD 9차 질병분류표 + 질병코딩지침서(8차) =====
    // 데이터는 KCD9 폴더 파일을 gzip으로 줄여 KOICD_PACKED(앞 script)에 넣어 두고, 처음 열 때 한 번 풂
    let koicd = null;
    const koicdReady = loadKoicd().catch(err => { console.error(err); return null; });

    async function unpackGzip(b64) {
      const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
      return new Response(stream).text();
    }

    async function loadKoicd() {
      const [kcdText, guideText, caseText] = await Promise.all([unpackGzip(KOICD_PACKED.kcd), unpackGzip(KOICD_PACKED.guide), unpackGzip(KOICD_PACKED.cases)]);
      // 분류표: 줄마다 "단계\t코드\t한글명\t영문명" (1=장, 2=블록, 3=3단위, 4~6=세분류)
      const rows = [], byCode = {}, stack = [];
      let ch = null, bl = null;
      kcdText.split("\n").forEach(line => {
        const [lv, code, kr, en] = line.split("\t");
        const r = { lv: +lv, code, kr, en, i: rows.length };
        if (r.lv === 1) ch = r;
        if (r.lv === 2) bl = r;
        r.ch = ch; r.bl = bl;
        while (stack.length && stack[stack.length - 1].lv >= r.lv) stack.pop();
        r.parent = stack[stack.length - 1] || null;
        stack.push(r);
        rows.push(r);
        if (r.lv >= 3) (byCode[code] = byCode[code] || []).push(r);
      });
      // 코딩지침서: [코드, 단계, 번호, 제목, 본문 HTML], 본문에 나오는 진단코드를 미리 뽑아 둠
      const guide = JSON.parse(guideText).map(([code, depth, num, title, html]) => {
        const text = title + " " + html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
        return { code, depth, num, title, html, refs: codeRefs(text) };
      });
      // 장 및 질환별 분류지침의 장 머리(예: "Ⅸ. 순환계통의 질환(I00-I99)")에서 코드 범위를 읽음
      const chapters = guide.filter(g => g.depth === 2 && g.code.startsWith("03")).map(g => {
        const m = g.title.match(/\(([A-Z]\d{2})-([A-Z]\d{2})\)/);
        return m ? { g, from: m[1], to: m[2] } : null;
      }).filter(Boolean);
      // 코딩사례집(8차): [번호, 사례명, 영문명, 최종진단 코드들, 코딩 적용사유, 사례 표 HTML]
      const cases = JSON.parse(caseText).map(([num, title, en, codes, reason, html]) => ({
        num, title, en, codes: [].concat(codes || []), html, refs: codeRefs(reason || "")
      }));
      koicd = { rows, byCode, guide, chapters, cases };
      document.getElementById("kcd-list").innerHTML = rows.filter(r => r.lv === 3 && /^[A-Z]\d{2}$/.test(r.code))
        .map(r => '<option value="' + r.code + '">' + escapeHtml(r.kr) + '</option>').join("");
      return koicd;
    }

    // 지침 본문에 나오는 코드: 단일(I63.58, G46.-) 또는 범위(C76~C79, I21.0-I21.3)
    function codeRefs(text) {
      const refs = [];
      const re = /([A-Z]\d{2}(?:\.\d{1,3})?)(?:\.-)?(?:\s*[~\-–]\s*([A-Z]?\d{2}(?:\.\d{1,3})?))?/g;
      let m;
      while ((m = re.exec(text))) {
        let a = m[1], b = m[2] || m[1];
        if (/^\d/.test(b)) b = a[0] + b;
        refs.push({ a, b });
      }
      return refs;
    }

    function normCode(s) {
      s = (s || "").trim().toUpperCase().replace(/\s+/g, "");
      const m = s.match(/^([A-Z]\d{2})\.?(\d{0,3})-?$/);
      if (m) return m[2] ? m[1] + "." + m[2] : m[1];
      return s;
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }

    // 코드와 관련된 코딩지침: 3점 코드 그대로 언급, 2점 같은 3단위 코드 언급, 1점 좁은 범위에 포함
    function relatedGuides(code) {
      if (!koicd || !/^[A-Z]\d{2}(\.\d+)?$/.test(code)) return [];
      const cat = code.slice(0, 3);
      const scored = [];
      koicd.guide.forEach((g, idx) => {
        if (g.depth < 2 || !g.html) return;
        let score = 0;
        g.refs.forEach(({ a, b }) => {
          if (a === b) {
            if (a === code) score = Math.max(score, 3);
            else if (a.slice(0, 3) === cat) score = Math.max(score, 2);
          } else if (a[0] === b[0] && a[0] === cat[0] && Math.abs(+b.slice(1, 3) - +a.slice(1, 3)) <= 20
                     && a.slice(0, 3) <= cat && cat <= b.slice(0, 3)) {
            score = Math.max(score, (a.slice(0, 3) === cat || b.slice(0, 3) === cat) ? 2 : 1);
          }
        });
        if (score) scored.push({ g, score, idx });
      });
      return scored.sort((x, y) => y.score - x.score || x.idx - y.idx).map(s => Object.assign({ score: s.score }, s.g));
    }

    // 코드가 속한 장의 코딩지침 (예: I21 → Ⅸ. 순환계통의 질환 아래 지침들)
    function chapterGuides(code) {
      if (!koicd) return [];
      // 신생물 형태분류(M8000/3 등)는 Ⅱ. 신생물 장의 지침으로
      const cat = code.includes("/") ? "C00" : code.slice(0, 3);
      const heads = koicd.chapters.filter(c => c.from <= cat && cat <= c.to).map(c => c.g.code);
      return koicd.guide.filter(g => g.depth > 2 && g.html && heads.some(h => g.code.startsWith(h)));
    }

    // 코드와 관련된 코딩사례: 3점 최종진단이 이 코드, 2점 최종진단이 같은 3단위 코드, 1점 코딩 적용사유에서 같은 3단위 코드 언급
    function relatedCases(code) {
      if (!koicd || !/^[A-Z]\d{2}(\.\d+)?$/.test(code)) return [];
      const cat = code.slice(0, 3);
      return koicd.cases.map((c, idx) => {
        let score = 0;
        c.codes.forEach(x => {
          if (x === code) score = Math.max(score, 3);
          else if (x.slice(0, 3) === cat) score = Math.max(score, 2);
        });
        if (!score && c.refs.some(({ a, b }) => a.slice(0, 3) === cat || b.slice(0, 3) === cat)) score = 1;
        return { c, score, idx };
      }).filter(s => s.score).sort((x, y) => y.score - x.score || x.idx - y.idx).map(s => Object.assign({ score: s.score }, s.c));
    }

    function koicdName(code) {
      if (KCD[code]) return KCD[code].name;
      const rs = koicd && koicd.byCode[code];
      return rs ? rs[0].kr : "";
    }

    // 메뉴 미리보기 줄: 진단명 · 대표 코딩지침 · 코딩사례
    function koicdPreview(code) {
      const rs = koicd && koicd.byCode[code];
      if (!rs) return [["진단", "KCD 9차 분류표에 없는 코드", code]];
      const g = relatedGuides(code)[0];
      const cs = relatedCases(code).filter(c => c.score >= 2);
      return [
        ["진단", rs[0].kr, code],
        ["코딩지침", g ? g.title : "직접 관련된 지침 없음", g ? g.num : ""],
        ["코딩사례", cs.length ? cs[0].num + " " + cs[0].title + (cs.length > 1 ? " 외" : "") : "관련 사례 없음", cs.length ? cs.length + "건" : ""]
      ];
    }

    // 하위 코드 전체 (r 바로 뒤에서 단계가 더 깊은 줄들)
    function subtree(r) {
      const out = [r];
      for (let i = r.i + 1; i < koicd.rows.length && koicd.rows[i].lv > r.lv; i++) out.push(koicd.rows[i]);
      return out;
    }

    function codeLink(code) {
      return '<a data-kcd="' + escapeHtml(code) + '">' + escapeHtml(code) + '</a>';
    }

    // KOICD 탭: 진단코드(또는 병명)로 분류·관련 진단코드·코딩지침 표시
    async function showKoicd(input) {
      const box = document.getElementById("koicd-result");
      const q = (input || "").trim();
      if (!q) return;
      const code = normCode(q);
      document.getElementById("koicd-query").value = code;
      if (!koicd) box.innerHTML = '<div class="kcd-box">KCD 9차 분류표를 불러오는 중…</div>';
      await koicdReady;
      if (!koicd) {
        box.innerHTML = '<div class="kcd-box">분류표를 불러오지 못했어요. 최신 Chrome·Edge·Safari에서 열어 주세요.</div>';
        return;
      }
      const rs = koicd.byCode[code];
      if (!rs) { box.innerHTML = renderKoicdSearch(q, code); return; }
      box.innerHTML = renderKoicdCode(code, rs);
    }

    // 코드가 없을 때: 코드 앞부분 또는 병명(한글·영문)으로 찾은 목록
    function renderKoicdSearch(q, code) {
      const word = q.toLowerCase();
      const isCode = /^[A-Z]\d/.test(code);
      const hits = koicd.rows.filter(r => r.lv >= 3 &&
        (isCode ? r.code.startsWith(code) : (r.kr.toLowerCase().includes(word) || r.en.toLowerCase().includes(word))))
        .sort((x, y) => x.lv - y.lv || x.i - y.i).slice(0, 80);
      if (!hits.length) return '<div class="kcd-box"><h3>' + escapeHtml(q) + '</h3><p class="none">KCD 9차 분류표에서 찾지 못했어요. 코드(예: I21, I63.5)나 다른 병명으로 찾아 보세요.</p></div>';
      return '<div class="kcd-box"><h3>"' + escapeHtml(q) + '" 검색 결과 ' + hits.length + (hits.length === 80 ? '건 이상 (앞 80건)' : '건') + '</h3>'
        + '<table class="kcd-table">' + hits.map(r => '<tr><td class="c">' + codeLink(r.code) + '</td><td>' + escapeHtml(r.kr)
        + ' <span class="kcd-en">' + escapeHtml(r.en) + '</span></td></tr>').join("") + '</table></div>';
    }

    function renderKoicdCode(code, rs) {
      const r = rs[0];
      let cat = r;
      while (cat.lv > 3) cat = cat.parent;
      const path = [r.ch.kr, r.bl.kr];
      for (let p = r.parent; p && p.lv >= 3; p = p.parent) path.splice(2, 0, p.code + " " + p.kr);
      // 1) 코드 요약 카드
      let html = '<div class="kcd-box kcd-head"><span class="kcd-badge">' + escapeHtml(code) + '</span><div>'
        + '<div class="name">' + rs.map(x => escapeHtml(x.kr)).join(" / ") + '</div>'
        + '<div class="kcd-en">' + escapeHtml(r.en) + '</div>'
        + '<div class="kcd-path">' + path.map(escapeHtml).join(" › ") + '</div>'
        + '<a href="https://www.koicd.kr/kcd/kcd9.do?kcd=' + encodeURIComponent(code) + '" target="_blank" rel="noopener">KOICD에서 원문 보기 (포함·제외 문구) ↗</a></div></div>';

      // 2) 진단코드: 같은 3단위 코드의 하위 코드 전체 (많으면 4단위까지 + 입력 코드의 하위)
      let list = subtree(cat);
      let cut = false;
      if (list.length > 80) {
        const mine = new Set(r === cat ? [] : subtree(r).map(x => x.i));
        list = list.filter(x => x.lv <= 4 || mine.has(x.i) || x.i === r.parent.i);
        cut = true;
      }
      const sib = koicd.rows.filter(x => x.lv === 3 && x.bl === r.bl);
      const codePanel = '<div class="kcd-tools"><span>' + escapeHtml(cat.code + " " + cat.kr) + '의 세분류 ' + list.length + '개</span></div>'
        + (cut ? '<p class="kcd-src" style="margin-top:0">하위 코드가 많아 4단위까지와 입력한 코드의 하위 코드만 보여요.</p>' : '')
        + '<table class="kcd-table">' + list.map(x => '<tr class="' + (x.code === code ? 'hit' : x.lv === 3 ? 'lv3' : '') + '"><td class="c">'
        + '&nbsp;'.repeat((x.lv - 3) * 3) + codeLink(x.code) + '</td><td>' + escapeHtml(x.kr)
        + '<span class="kcd-en">' + escapeHtml(x.en) + '</span></td></tr>').join("") + '</table>'
        + '<div class="kcd-sub">같은 항목군 · ' + escapeHtml(r.bl.kr) + '</div><div class="kcd-chips">'
        + sib.map(x => '<a class="kcd-chip' + (x === cat ? ' on' : '') + '" data-kcd="' + escapeHtml(x.code) + '" title="'
        + escapeHtml(x.kr) + '">' + escapeHtml(x.code) + ' ' + escapeHtml(x.kr.length > 14 ? x.kr.slice(0, 14) + "…" : x.kr) + '</a>').join("")
        + '</div>';

      // 3) 코딩지침: 코드를 언급한 지침은 첫 개만 펼쳐서, 같은 장의 나머지 지침은 접어서
      const rel = relatedGuides(code);
      const shown = new Set(rel.map(g => g.code));
      const rest = chapterGuides(code).filter(g => !shown.has(g.code));
      const why = { 3: "이 코드 언급", 2: "같은 3단위 코드 언급", 1: "코드 범위에 포함" };
      const guideCard = (g, open, note) => '<details class="kcd-card"' + (open ? ' open' : '') + '><summary>'
        + '<span class="num">' + escapeHtml(g.num) + '</span><span class="title">' + escapeHtml(g.title) + '</span>'
        + (note ? '<span class="why">' + note + '</span>' : '') + '</summary><div class="body">' + g.html + '</div></details>';
      let guidePanel = '';
      if (rel.length || rest.length) guidePanel += toolsBar(rel.length ? "이 코드와 관련된 지침 " + rel.length + "개" : "이 코드를 직접 언급한 지침은 없어요. 같은 장의 지침을 확인해 보세요.");
      else guidePanel += '<p class="none">이 코드와 관련된 코딩지침이 없어요.</p>';
      guidePanel += rel.map((g, i) => guideCard(g, i === 0, why[g.score])).join("");
      if (rest.length) guidePanel += '<div class="kcd-sub">같은 장의 다른 코딩지침 ' + rest.length + '개</div>' + rest.map(g => guideCard(g, false, "")).join("");
      guidePanel += '<p class="kcd-src">출처: <a href="https://www.koicd.kr/kcd/coding.do" target="_blank" rel="noopener">KOICD 질병코딩지침서</a>(8차 · 9차 지침은 아직 공개 전).</p>';

      // 4) 코딩사례: 최종진단 코드가 맞는 사례 먼저, 첫 사례만 펼쳐서 (진단코드를 칩으로)
      const cs = relatedCases(code);
      const caseWhy = { 3: "최종진단이 이 코드", 2: "최종진단이 같은 3단위 코드", 1: "적용사유에서 같은 3단위 코드 언급" };
      let casePanel = cs.length ? toolsBar("관련 사례 " + cs.length + "건") : '<p class="none">이 코드와 관련된 코딩사례가 없어요.</p>';
      casePanel += cs.map((c, i) => '<details class="kcd-card"' + (i === 0 && c.score >= 2 ? ' open' : '') + '><summary>'
        + '<span class="num">' + escapeHtml(c.num) + '</span><span class="title">' + escapeHtml(c.title) + '</span>'
        + '<span class="kcd-en">' + escapeHtml(c.en || "") + '</span><span class="why">' + caseWhy[c.score] + '</span>'
        + '<span class="codes-row kcd-chips">' + c.codes.filter((x, k, a) => a.indexOf(x) === k)
          .map(x => '<span class="kcd-chip ' + (x === code ? 'on' : 'plain') + '">' + escapeHtml(x) + '</span>').join("") + '</span>'
        + '</summary><div class="body">' + (c.html || "") + '</div></details>').join("");
      casePanel += '<p class="kcd-src">출처: <a href="https://www.koicd.kr/kcd/case.do" target="_blank" rel="noopener">KOICD 코딩사례집</a>(8차).</p>';

      // 탭: 진단코드 · 코딩지침 · 코딩사례 (마지막으로 본 탭을 기억)
      const tabs = [["code", "진단코드", list.length, codePanel], ["guide", "코딩지침", rel.length, guidePanel], ["case", "코딩사례", cs.length, casePanel]];
      html += '<div class="kcd-tabs">' + tabs.map(([k, label, n]) => '<button type="button" data-tab="' + k + '"' + (k === koicdTab ? ' class="on"' : '') + '>'
        + label + '<span class="n">' + n + '</span></button>').join("") + '</div>';
      html += tabs.map(([k, , , body]) => '<div class="kcd-box kcd-panel" data-panel="' + k + '"' + (k === koicdTab ? '' : ' hidden') + '>' + body + '</div>').join("");
      return html;
    }

    function toolsBar(text) {
      return '<div class="kcd-tools"><span>' + escapeHtml(text) + '</span><span><button type="button" data-expand="1">모두 펼치기</button> '
        + '<button type="button" data-expand="0">모두 접기</button></span></div>';
    }

    let koicdTab = "code";
    document.getElementById("koicd-result").addEventListener("click", e => {
      // 탭 바꾸기
      const tab = e.target.closest("[data-tab]");
      if (tab) {
        koicdTab = tab.dataset.tab;
        document.querySelectorAll("#koicd-result [data-tab]").forEach(b => b.classList.toggle("on", b === tab));
        document.querySelectorAll("#koicd-result [data-panel]").forEach(p => { p.hidden = p.dataset.panel !== koicdTab; });
        return;
      }
      // 모두 펼치기·접기
      const ex = e.target.closest("[data-expand]");
      if (ex) {
        ex.closest(".kcd-panel").querySelectorAll("details.kcd-card").forEach(d => { d.open = ex.dataset.expand === "1"; });
        return;
      }
      // 결과 안의 코드를 누르면 그 코드로 다시 찾기
      const a = e.target.closest("[data-kcd]");
      if (!a) return;
      showKoicd(a.dataset.kcd);
      document.getElementById("koicd-form").scrollIntoView({ behavior: "smooth" });
    });

    // ===== 약관: 표준약관(질병·상해보험, 손해보험 회사용)의 지급사유·지급 제한사유 =====
    // 문구는 보험업감독업무시행세칙 [별표 15] 원문에서 옮기고, 괄호에 조항을 적음
    const YAK_COMMON_LIMITS = [
      ["피보험자가 고의로 자신을 해친 경우. 다만, 심신상실 등으로 자유로운 의사결정을 할 수 없는 상태에서 자신을 해친 경우에는 지급", "제5조 제1항 제1호"],
      ["보험수익자가 고의로 피보험자를 해친 경우. 다만, 그 보험수익자가 일부 보험수익자이면 다른 보험수익자 몫은 지급", "제5조 제1항 제2호"],
      ["계약자가 고의로 피보험자를 해친 경우", "제5조 제1항 제3호"],
      ["피보험자의 임신, 출산(제왕절개 포함), 산후기. 다만, 보장개시일부터 2년이 지난 후 발생한 습관성 유산, 불임 및 인공수정 관련 합병증(N96~N98)은 지급", "제5조 제1항 제4호"],
      ["전쟁, 외국의 무력행사, 혁명, 내란, 사변, 폭동", "제5조 제1항 제5호"]
    ];
    const YAK_INJURY_LIMITS = [
      ["(직업·직무·동호회 활동 목적) 전문등반, 글라이더 조종, 스카이다이빙, 스쿠버다이빙, 행글라이딩, 수상보트, 패러글라이딩", "제5조 제2항 제1호"],
      ["(직업·직무·동호회 활동 목적) 모터보트, 자동차 또는 오토바이에 의한 경기, 시범, 흥행(연습 포함) 또는 시운전. 다만, 공용도로상 시운전 중 사고는 보장", "제5조 제2항 제2호"],
      ["(직업·직무·동호회 활동 목적) 선박에 탑승하는 것을 직무로 하는 사람이 직무상 선박에 탑승하고 있는 동안", "제5조 제2항 제3호"]
    ];
    const YAK_JOB_LIMITS = [
      ["보험기간 중 직업·직무 변경, 운전 목적·운전 여부 변경, 이륜자동차·원동기장치 자전거 계속 사용 시 지체 없이 회사에 알려야 함", "제15조 제1항"],
      ["위험이 증가했는데 추가보험료를 내지 않거나, 고의·중대한 과실로 알리지 않은 경우: 변경 전 요율 ÷ 변경 후 요율 비율로 보험금 삭감 지급. 다만, 증가된 위험과 관계없이 생긴 사고는 원래대로 지급", "제15조 제4항·제5항"],
      ["뚜렷한 위험 증가와 관련된 계약 후 알릴 의무를 고의·중대한 과실로 이행하지 않으면 계약 해지 가능", "제16조 제1항 제2호"]
    ];
    const YAK_GROUPS = {
      "상해사망": {
        pay: [
          ["보험기간 중에 상해의 직접결과로써 사망한 경우(질병으로 인한 사망은 제외): 사망보험금", "제3조 제1호"],
          ["상해란 보험기간 중에 발생한 급격하고도 우연한 외래의 사고로 신체에 입은 상해", "제2조 제2호 가목"],
          ["실종선고를 받은 경우, 관공서가 수해·화재 등 재난을 조사해 사망으로 통보한 경우도 '사망'에 포함", "제4조 제1항"]
        ],
        limits: [], injury: true,
        cardPay: "상해로 직접 사망 (질병 제외)", cardLimit: "고의·전쟁 등, 위험한 활동 중 사고"
      },
      "후유장해": {
        pay: [
          ["보험기간 중 진단확정된 질병 또는 상해로 장해분류표에서 정한 각 장해지급률에 해당하는 장해상태가 되었을 때: 후유장해보험금", "제3조 제2호"],
          ["장해지급률이 상해 발생일 또는 진단확정일부터 180일 이내에 확정되지 않으면 180일이 되는 날의 의사 진단에 기초해 결정", "제4조 제3항"],
          ["같은 질병 또는 상해로 두 가지 이상의 후유장해가 생기면 지급률을 합산", "제4조 제10항"]
        ],
        limits: [
          ["장해분류표의 각 장해분류별 최저 지급률 장해정도에 이르지 않는 후유장해는 지급하지 않음", "제4조 제8항 단서"],
          ["이미 후유장해보험금을 받은 동일한 부위에 가중된 때에는 이미 받은 보험금을 차감", "제4조 제11항"],
          ["하나의 진단확정된 질병 또는 상해로 인한 후유장해보험금은 보험가입금액이 한도", "제4조 제13항"]
        ],
        injury: true,
        cardPay: "질병·상해로 장해분류표의 장해상태", cardLimit: "최저 지급률에 못 미치는 장해"
      },
      "질병(진단·입원·수술)": {
        pay: [
          ["보험기간 중 진단확정된 질병 또는 상해로 입원, 통원, 요양, 수술 또는 수발(간병)이 필요한 상태가 되었을 때: 입원보험금, 간병보험금 등", "제3조 제3호"]
        ],
        limits: [], injury: false,
        cardPay: "질병으로 입원·수술 등 (진단비는 특약)", cardLimit: "고의, 임신·출산, 전쟁 등",
        notice: "뇌혈관질환·급성심근경색증·암 진단비는 표준약관에 없는 상품별 특별약관 담보예요. 진단확정 방법 등 세부 지급기준은 해당 상품의 특별약관을 확인하세요."
      }
    };
    let yakCurrent = "상해사망";
    let yakJob = "";

    function guessYakGroup(cover) {
      if (/장해/.test(cover)) return "후유장해";
      if (/사망/.test(cover)) return "상해사망";
      if (/(진단|입원|수술|뇌|암|심근|심장|질병)/.test(cover)) return "질병(진단·입원·수술)";
      return null;
    }

    function liHtml(items) {
      return items.map(([t, art]) => {
        const li = document.createElement("li");
        li.textContent = t + " ";
        const s = document.createElement("span");
        s.className = "art";
        s.textContent = "(" + art + ")";
        li.appendChild(s);
        return li.outerHTML;
      }).join("");
    }

    function renderYak() {
      const g = YAK_GROUPS[yakCurrent];
      document.querySelectorAll(".yak-group").forEach(b => b.classList.toggle("active", b.dataset.group === yakCurrent));
      let pay = '<div class="yak-box pay"><h3>지급사유</h3><ul>' + liHtml(g.pay) + '</ul>';
      if (g.notice) pay += '<p class="notice"></p>';
      pay += '</div>';
      let limit = '<div class="yak-box limit"><h3>지급 제한사유</h3>';
      if (g.limits.length) limit += '<div class="sub">이 담보의 제한</div><ul>' + liHtml(g.limits) + '</ul>';
      limit += '<div class="sub">공통: 보험금을 지급하지 않는 사유</div><ul>' + liHtml(YAK_COMMON_LIMITS) + '</ul>';
      if (g.injury) {
        limit += '<div class="sub">상해 관련: 위험한 활동 중 사고</div><ul>' + liHtml(YAK_INJURY_LIMITS) + '</ul>';
        limit += '<div class="sub">계약 후 알릴 의무(직업 변경 등)' + (yakJob ? ' · 기고지 직업: <span class="job"></span>' : '') + '</div><ul>' + liHtml(YAK_JOB_LIMITS) + '</ul>';
      }
      limit += '</div>';
      const panel = document.getElementById("yak-panel");
      panel.innerHTML = pay + limit;
      if (g.notice) panel.querySelector(".notice").textContent = g.notice;
      const jobEl = panel.querySelector(".job");
      if (jobEl) jobEl.textContent = yakJob;
    }

    (function initYak() {
      const wrap = document.getElementById("yak-groups");
      Object.keys(YAK_GROUPS).forEach(name => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "code yak-group";
        b.dataset.group = name;
        b.textContent = name;
        b.addEventListener("click", () => { yakCurrent = name; renderYak(); });
        wrap.appendChild(b);
      });
      renderYak();
    })();

    // ===== 약관: 현대해상 공시실에서 가입 당시 상품의 약관 PDF를 받아 청구 담보의 조항을 원문 그대로 따옴 =====
    // 공시실 화면이 쓰는 요청을 그대로 씀 (현대해상 서버가 다른 곳의 요청도 허용: Access-Control-Allow-Origin *)
    //  HHCA0310M38S: 상품 검색 (가입일을 주면 그날 판매 중이던 버전만)  /  HHCA0310M26S: 약관 파일 위치
    const HI_URL = "https://www.hi.co.kr";
    const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
    const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮";
    let yakState = { run: 0, products: [], prodIdx: 0, doc: null, clauseIdx: -1, cover: "", note: "" };
    const yakDocs = new Map();  // apnflId → 읽어 둔 약관 (이번에 연 동안)

    async function hiCall(tranId, request) {
      const body = { header: { gId: String(Date.now()), tranId, channelId: "HI-HOME", clientIp: "127.0.0.1", menuId: "100932", loginId: null }, request };
      let r;
      try {
        r = await fetch(HI_URL + "/ajax.xhi", { method: "POST", headers: { "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify(body) });
      } catch (e) {
        // 인터넷이 끊겼거나 이 화면이 외부 사이트 연결을 막는 곳에서 열린 경우
        throw new Error("현대해상 공시실에 연결하지 못했어요(인터넷 연결 또는 열어 둔 곳의 제한).");
      }
      if (!r.ok) throw new Error("현대해상 응답 오류 " + r.status);
      return (await r.json()).data;
    }

    let pdfJsReady = null;
    function loadPdfJs() {
      if (!pdfJsReady) pdfJsReady = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = PDFJS_URL + "pdf.min.js";
        s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_URL + "pdf.worker.min.js"; resolve(window.pdfjsLib); };
        s.onerror = () => { pdfJsReady = null; reject(new Error("PDF 읽기 도구를 불러오지 못했어요")); };
        document.head.appendChild(s);
      });
      return pdfJsReady;
    }

    // 읽은 약관 글자는 이 브라우저에 저장해 두고 다음에 바로 씀 (IndexedDB, 실패해도 동작에는 지장 없음)
    function yakDbOpen() {
      return new Promise((resolve) => {
        try {
          const req = indexedDB.open("yak_cache", 1);
          req.onupgradeneeded = () => req.result.createObjectStore("docs");
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    }
    async function yakDbGet(id) {
      const db = await yakDbOpen();
      if (!db) return null;
      return new Promise(resolve => {
        try { const r = db.transaction("docs").objectStore("docs").get(id); r.onsuccess = () => resolve(r.result || null); r.onerror = () => resolve(null); }
        catch (e) { resolve(null); }
      });
    }
    async function yakDbPut(id, value) {
      const db = await yakDbOpen();
      if (!db) return;
      try { db.transaction("docs", "readwrite").objectStore("docs").put(value, id); } catch (e) {}
    }

    function yakStatus(text, pct, err) {
      document.getElementById("yak-live").innerHTML = '<div class="yak-status' + (err ? ' err' : '') + '"><span>' + escapeHtml(text) + '</span>'
        + (pct != null ? '<span class="bar"><i style="width:' + Math.round(pct) + '%"></i></span>' : '') + '</div>';
    }

    // 약관 PDF 받기 → 쪽마다 글자 뽑기. 같은 약관을 동시에 두 번 받지 않도록 진행 중인 것도 기억
    // report(글, 진행률): 진행 상황을 보여 줄 곳 (처음 화면 또는 약관 탭)
    const yakLoading = new Map();
    function yakLoadDoc(prod, run, report) {
      if (yakDocs.has(prod.clauApnflId)) return Promise.resolve(yakDocs.get(prod.clauApnflId));
      const say = report || ((t, p) => { if (run === yakState.run) yakStatus(t, p); });
      if (yakLoading.has(prod.clauApnflId)) { const p = yakLoading.get(prod.clauApnflId); p.listeners.push(say); return p; }
      const listeners = [say];
      const p = yakLoadDocNow(prod, (t, pct) => listeners.forEach(fn => fn(t, pct))).finally(() => yakLoading.delete(prod.clauApnflId));
      p.listeners = listeners;
      yakLoading.set(prod.clauApnflId, p);
      return p;
    }
    async function yakLoadDocNow(prod, say) {
      const f = await hiCall("HHCA0310M26S", { apnflId: prod.clauApnflId });
      const url = HI_URL + "/FileActionServlet/preview/0" + f.savPath + "/" + encodeURIComponent(f.savFileNm) + "." + f.flExts;
      const cacheKey = "v3:" + prod.clauApnflId;  // 글자 뽑는 방식을 바꾸면 v 번호를 올려 예전 저장본을 안 씀
      let pages = (await yakDbGet(cacheKey)) || null;
      if (!pages) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("약관 파일을 받지 못했어요 (" + res.status + ")");
        const total = Number(res.headers.get("Content-Length")) || f.fileSz || 0;
        const reader = res.body.getReader();
        const chunks = [];
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value); got += value.length;
          say("약관 내려받는 중… " + (got / 1048576).toFixed(1) + " / " + (total / 1048576).toFixed(1) + "MB", total ? got / total * 60 : null);
        }
        const buf = new Uint8Array(got);
        let o = 0;
        chunks.forEach(c => { buf.set(c, o); o += c.length; });
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        pages = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const tc = await (await doc.getPage(i)).getTextContent();
          // 줄 끝은 pdf.js가 알려 주는 hasEOL로 (PDF 원래 줄과 같음). 없는 경우만 글자 높이로 짐작
          let s = "";
          if (tc.items.some(it => "hasEOL" in it)) {
            tc.items.forEach(it => { s += it.str; if (it.hasEOL) s += "\n"; });
          } else {
            let lastY = null;
            tc.items.forEach(it => {
              if (!it.str.trim()) { if (it.str) s += " "; return; }
              const y = it.transform[5], h = Math.abs(it.transform[3]) || it.height || 10;
              if (lastY !== null && Math.abs(y - lastY) > Math.max(2, h * 0.5)) s += "\n";
              s += it.str; lastY = y;
            });
          }
          pages.push(s.replace(/\u0000/g, " "));
          if (i % 20 === 0) say("약관 읽는 중… " + i + " / " + doc.numPages + "쪽", 60 + i / doc.numPages * 40);
        }
        yakDbPut(cacheKey, pages);
      }
      const parsed = yakParse(pages);
      parsed.url = url;
      parsed.fileName = f.originalFileNm || "";
      yakDocs.set(prod.clauApnflId, parsed);
      return parsed;
    }

    // 약관 글 → 보통약관과 특약(번호 머리말 "2-34 ○○ 특별약관")으로 나눔. 쪽 머리·꼬리(쪽번호, 상품명)는 뺌
    function yakParse(pages) {
      const offs = [];
      let all = "";
      pages.forEach(p => {
        offs.push(all.length);
        const lines = p.split("\n").filter(l => !/^\s*\d{1,4}\s*$/.test(l)
          && !/^\s*(\d{1,4}\s+)?[^\n]{0,80}\([A-Za-z]{1,3}\d{4}\)[\s\d종/,·]*$/.test(l));  // 쪽번호, 쪽 머리의 상품명(Hi2607) 줄
        all += lines.join("\n") + "\n";
      });
      const pageOf = at => { let lo = 0, hi = offs.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (offs[m] <= at) lo = m; else hi = m - 1; } return lo + 1; };
      // 특약 머리말은 보통 줄 맨 앞이지만, 앞 특약의 마지막 문장 끝에 붙어 나오는 PDF도 있음 ("…제외합니다.1-2 ○○ 특별약관")
      const heads = [];
      const re = /(^|[.)\]다\s])[ \t]*(\d{1,2}(?:-\d{1,3}){1,3})[ \t]+([^\n]{2,90}?(?:특별약관|특약))[ \t]*$/gm;
      let m;
      while ((m = re.exec(all))) {
        if (/[·…]{3,}|\.{4,}/.test(m[0])) continue;  // 목차 줄
        heads.push({ no: m[2], name: m[3].replace(/\s+/g, ""), at: m.index + m[1].length });
      }
      // 보통약관: '보통약관' 머리말 뒤 3,000자 안에 제1조가 있는 첫 자리
      let boAt = -1;
      const bre = /^[^\n]{0,30}보통약관[ \t]*$/gm;
      while ((m = bre.exec(all))) {
        if (/[·…]{3,}/.test(m[0])) continue;
        if (/제\s*1\s*조\s*\(/.test(all.slice(m.index, m.index + 3000))) { boAt = m.index; break; }
      }
      const clauses = [];
      if (boAt >= 0) {
        const next = heads.find(h => h.at > boAt);
        clauses.push({ no: "", name: "보통약관", at: boAt, end: next ? next.at : all.length });
      }
      heads.forEach((h, i) => clauses.push(Object.assign({}, h, { end: i + 1 < heads.length ? heads[i + 1].at : all.length })));
      clauses.sort((a, b) => a.at - b.at);
      // 머리말을 못 알아본 특약이 앞 특약에 붙는 경우 대비: 한 특약 안에서 '제1조'가 다시 나오면 거기서 나누고,
      // 바로 윗줄(들)을 특약 이름으로 씀
      const split = [];
      clauses.forEach(c => {
        if (c.name === "보통약관") { split.push(c); return; }
        const text = all.slice(c.at, c.end);
        const starts = [...text.matchAll(/^[ \t]*제\s*1\s*조\s*\(/gm)].map(x => x.index);
        if (starts.length < 2) { split.push(c); return; }
        starts.forEach((st, k) => {
          if (k === 0) { split.push(Object.assign({}, c, { end: c.at + (starts[1] - lineBack(text, starts[1])) })); return; }
          const from = c.at + st - lineBack(text, st);
          const nameLines = all.slice(from, c.at + st).trim().replace(/\s+/g, " ");
          const end = k + 1 < starts.length ? c.at + starts[k + 1] - lineBack(text, starts[k + 1]) : c.end;
          const nm = (nameLines.match(/[^.。]{2,90}(?:특별약관|특약)$/) || [nameLines.slice(-40) || "이름 없는 특약"])[0].trim();
          const numbered = nm.match(/^(\d{1,2}(?:-\d{1,3}){1,3})\s+(.+)$/);
          split.push({ no: numbered ? numbered[1] : "", name: (numbered ? numbered[2] : nm).replace(/\s+/g, ""), at: from, end });
        });
      });
      return { all, pageOf, clauses: split, pages: pages.length };

      // 제1조 바로 위 1~2줄의 길이 (특약 이름이 두 줄로 나뉜 경우 포함)
      function lineBack(text, pos) {
        const p1 = text.lastIndexOf("\n", pos - 2);
        const p2 = text.lastIndexOf("\n", p1 - 1);
        const l1 = text.slice(p1 + 1, pos), l2 = p2 >= 0 ? text.slice(p2 + 1, p1) : "";
        return /(특별약관|특약)\s*$/.test(l1) && !/(특별약관|특약)/.test(l2) && l2.length < 40 && !/[.다]\s*$/.test(l2) ? pos - p2 - 1 : pos - p1 - 1;
      }
    }

    // 조항 나누기: "제1조 (보험금의 지급사유)" 단위
    function yakArticles(doc, clause) {
      const text = doc.all.slice(clause.at, clause.end);
      const re = /^[ \t]*제\s*(\d+)\s*조\s*(?:의\s*(\d+)\s*)?\(([^)\n]{1,40})\)/gm;
      const marks = [];
      let m;
      while ((m = re.exec(text))) marks.push({ n: Number(m[1]), title: m[3].replace(/\s+/g, " ").trim(), at: m.index, label: "제" + m[1] + "조" + (m[2] ? "의" + m[2] : "") });
      return marks.map((a, i) => {
        const body = text.slice(a.at, i + 1 < marks.length ? marks[i + 1].at : text.length);
        return Object.assign(a, { body: yakReflow(body.replace(/^[^\n]*\n/, "")), page: doc.pageOf(clause.at + a.at) });
      });
    }

    // PDF 줄바꿈 다듬기: 폭이 꽉 찬 줄은 다음 줄과 이어 붙이고(단어 중간에서 끊긴 줄),
    // ①·1.·가. 같은 항목 시작, 문장 끝, 짧은 줄(표 칸)은 그대로 둠
    function yakReflow(body) {
      const lines = body.split("\n").map(l => l.replace(/\s+$/, m => m ? " " : ""));
      const lens = lines.map(l => l.trim().length).sort((a, b) => b - a);
      const full = lens[Math.min(lens.length - 1, Math.floor(lens.length * 0.1))] || 0;
      const marker = /^\s*([①-⑳]|\d{1,2}\.\s|\d{1,2}\)|[가-하]\.|\(\d{1,2}\)|※|\*|[-•·]\s|\[|【|<|제\s*\d+\s*조)/;
      let out = "";
      lines.forEach((l, i) => {
        if (i === 0) { out = l; return; }
        const prev = lines[i - 1];
        // 짧은 줄이 두 줄 이상 이어지면 표 칸으로 보고 붙이지 않음
        const short = s => s !== undefined && s.trim().length < full * 0.5;
        const table = short(l) && short(lines[i + 1]) && !marker.test(lines[i + 1]);
        const join = full >= 20 && prev.trim().length >= full * 0.72 && !/(다\.|[.:：])\s*$/.test(prev) && !marker.test(l) && !table;
        out += (join ? "" : "\n") + l;
      });
      return out.replace(/[ \t]{2,}/g, " ").trim();
    }

    function yakKind(title) {
      const t = title.replace(/\s+/g, "");
      if (/(지급하지않는|보장하지않는|보상하지않는)사유|면책|지급제한|지급의제한/.test(t)) return "limit";
      if (/지급사유/.test(t)) return "pay";
      if (/정의|진단확정|세부규정|보장개시|지급기준|분류|판정|확정/.test(t)) return "crit";
      return "other";
    }

    // 원문 안의 '보통약관 제6조(…) 제1항' 같은 참조를 찾아 그 조항(항)을 가져옴
    function yakFollowRefs(doc, article) {
      const bo = doc.clauses.find(c => c.name === "보통약관");
      if (!bo) return [];
      const boArts = yakArticles(doc, bo);
      const out = [];
      const re = /보통약관\s*제\s*(\d+)\s*조\s*(?:\(([^)]*)\))?\s*(?:제\s*(\d+)\s*항)?/g;
      let m;
      while ((m = re.exec(article.body))) {
        const a = boArts.find(x => x.n === Number(m[1]));
        if (!a || out.some(o => o.key === m[0])) continue;
        let body = a.body;
        const hang = m[3] ? Number(m[3]) : 0;
        if (hang && CIRCLED[hang - 1]) {
          const s = body.indexOf(CIRCLED[hang - 1]);
          const e = CIRCLED[hang] ? body.indexOf(CIRCLED[hang], s + 1) : -1;
          if (s >= 0) body = body.slice(s, e > s ? e : body.length).trim();
        }
        out.push({ key: m[0], label: "보통약관 " + a.label + (hang ? " 제" + hang + "항" : ""), title: a.title, body, page: a.page });
      }
      return out;
    }

    // 담보명 ↔ 특약명 맞추기: 흔한 말(특별약관·보장·비 등)을 빼고 두 글자씩 겹치는 정도로
    function yakNormCover(s) {
      return (s || "").replace(/\s+/g, "").replace(/특별약관|특약|보장|담보|보험금/g, "").replace(/\(?갱신형\)?/g, "")
        .replace(/진단비/g, "진단").replace(/수술비/g, "수술").replace(/입원비/g, "입원").replace(/증/g, "").replace(/비$/, "");
    }
    function yakScore(cover, name) {
      const a = yakNormCover(cover), b = yakNormCover(name);
      if (!a || !b) return 0;
      const grams = s => { const g = []; for (let i = 0; i < s.length - 1; i++) g.push(s.slice(i, i + 2)); return g; };
      const ga = grams(a), gb = grams(b).slice();
      let hit = 0;
      ga.forEach(g => { const k = gb.indexOf(g); if (k >= 0) { hit++; gb.splice(k, 1); } });
      let s = ga.length + grams(b).length ? 2 * hit / (ga.length + grams(b).length) : 0;
      if (a.includes(b) || b.includes(a)) s += 0.3;
      if (b.startsWith(a) || a.startsWith(b)) s += 0.2;  // '암진단' → '암진단Ⅱ(일반암)'이 '특정암진단'보다 앞

      // 입력에 없는 변형(갱신형·납입면제·재진단·두번째 등)은 기본형보다 뒤로
      ["갱신형", "납입면제", "재진단", "두번째", "연간", "종합병원", "상급", "후보장"].forEach(w => { if (name.includes(w) && !(cover || "").includes(w)) s -= 0.04; });
      return s;
    }

    function yakFirstSentence(t) {
      const s = (t || "").replace(/\s+/g, " ").trim();
      const m = s.match(/^.{10,160}?(?:지급합니다|드립니다|지급하여 드립니다|합니다)\./);
      return m ? m[0] : s.slice(0, 90) + (s.length > 90 ? "…" : "");
    }

    // 공시실 상품 검색 (가입일에 판매 중이던 버전 → 없으면 전체 버전). 같은 상품명·가입일은 다시 묻지 않음
    const yakSearchCache = new Map();
    async function yakFindProducts(product, date) {
      const key = product + "|" + (date || "");
      if (yakSearchCache.has(key)) return yakSearchCache.get(key);
      const ymd = (date || "").replace(/-/g, "");
      const pick = d => [...(d.slYProdList || []), ...(d.slNProdList || [])].filter(p => p && p.clauApnflId);
      let list = pick(await hiCall("HHCA0310M38S", { searchData: product, searchDate: ymd, searchType: ymd ? "1" : "0", searchKeyword: 1 }));
      let note = "";
      if (!list.length && ymd) {
        list = pick(await hiCall("HHCA0310M38S", { searchData: product, searchDate: "", searchType: "0", searchKeyword: 1 }));
        if (list.length) note = "가입일(" + date + ")에 판매 중이던 버전을 찾지 못해 전체 버전을 보여 줘요. 상품 버전을 확인해 주세요.";
      }
      const res = { list, note };
      if (list.length) yakSearchCache.set(key, res);
      return res;
    }

    // 약관에서 청구할 수 있는 담보 = '보험금의 지급사유' 조항이 있는 특약 (제도특약·할인특약 등은 빠짐), 이름이 같으면 하나만
    function yakCoverages(doc) {
      if (doc.coverages) return doc.coverages;
      const seen = new Set();
      doc.coverages = doc.clauses.map((c, i) => ({ c, i })).filter(({ c }) => yakArticles(doc, c).some(a => yakKind(a.title) === "pay"))
        .map(({ c, i }) => ({ i, no: c.no, name: c.name === "보통약관" ? "보통약관(기본계약)" : c.name }))
        .filter(x => !seen.has(x.name) && seen.add(x.name));
      return doc.coverages;
    }

    // 상품명·가입일·담보명으로 실행 (처음 화면 시작하기, 약관 탭의 '약관 찾기')
    // prodIdx: 처음 화면에서 고른 상품 버전 (같은 검색 결과일 때만 씀)
    async function yakRun(product, date, cover, prodIdx) {
      const run = ++yakState.run;
      document.getElementById("yak-product").value = product || "";
      document.getElementById("yak-date").value = date || "";
      document.getElementById("yak-cover").value = cover || "";
      if (!product) { document.getElementById("yak-live").innerHTML = ""; document.getElementById("yak-std").open = true; return null; }
      try {
        yakStatus("현대해상 공시실에서 '" + product + "' 찾는 중…", 5);
        const { list, note } = await yakFindProducts(product, date);
        if (run !== yakState.run) return null;
        if (!list.length) throw new Error("공시실에서 '" + product + "' 상품을 찾지 못했어요. 상품명을 줄여서(예: 퍼펙트플러스) 다시 찾아 보세요.");
        const idx = prodIdx >= 0 && prodIdx < list.length ? prodIdx : 0;
        yakState = Object.assign(yakState, { products: list, prodIdx: idx, doc: null, clauseIdx: -1, cover: cover || "", note });
        return await yakOpenProduct(idx, run);
      } catch (err) {
        if (run === yakState.run) {
          yakStatus(err.message + " 아래 '표준약관 기준으로 보기'를 참고하세요.", null, true);
          document.getElementById("yak-std").open = true;
        }
        return null;
      }
    }

    async function yakOpenProduct(idx, run) {
      yakState.prodIdx = idx;
      const prod = yakState.products[idx];
      yakStatus("약관 파일 찾는 중… " + prod.prodNm, 10);
      const doc = await yakLoadDoc(prod, run);
      if (run !== yakState.run) return null;
      if (doc.clauses.length < 2) throw new Error("약관에서 글자를 읽지 못했어요(스캔 이미지 약관일 수 있어요).");
      yakState.doc = doc;
      // 청구 담보에 가장 가까운 특약 (담보명이 없으면 보통약관)
      let best = doc.clauses.findIndex(c => c.name === "보통약관");
      if (yakState.cover && !/^보통약관/.test(yakState.cover)) {
        let top = -1;
        doc.clauses.forEach((c, i) => { const s = yakScore(yakState.cover, c.name); if (s > top) { top = s; best = i; } });
      }
      yakState.clauseIdx = Math.max(0, best);
      return yakRender();
    }

    function yakRender() {
      const { doc, products, prodIdx, clauseIdx, note } = yakState;
      const prod = products[prodIdx];
      const clause = doc.clauses[clauseIdx];
      const arts = yakArticles(doc, clause);
      const groups = { pay: [], crit: [], limit: [], other: [] };
      arts.forEach(a => groups[yakKind(a.title)].push(a));
      // 특약에 제한 조항이 없으면 보통약관의 '보험금을 지급하지 않는 사유'
      if (!groups.limit.length && clause.name !== "보통약관") {
        const bo = doc.clauses.find(c => c.name === "보통약관");
        if (bo) yakArticles(doc, bo).filter(a => yakKind(a.title) === "limit").forEach(a => groups.limit.push(Object.assign({}, a, { label: "보통약관 " + a.label })));
      }
      const secText = doc.all.slice(clause.at, clause.end);
      const kcd = secText.match(/제\s*(\d+)\s*차\s*한국표준질병/);
      const pdfLink = doc.url + "#page=" + doc.pageOf(clause.at);
      // 담보 목록: 청구 담보와 가까운 순 8개 + 나머지는 약관 순서
      const order = doc.clauses.map((c, i) => ({ i, s: yakState.cover ? yakScore(yakState.cover, c.name) : 0 }));
      const near = order.slice().sort((a, b) => b.s - a.s).slice(0, yakState.cover ? 8 : 0).map(o => o.i);
      const opt = i => { const c = doc.clauses[i]; return '<option value="' + i + '"' + (i === clauseIdx ? ' selected' : '') + '>' + escapeHtml((c.no ? c.no + " " : "") + c.name) + '</option>'; };
      const shortProd = p => p.prodNm.replace(/^무배당\s*/, "").replace(/현대해상/, "");
      const ymd = s => (s || "").trim().replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
      let html = note ? '<div class="yak-status err">' + escapeHtml(note) + '</div>' : '';
      html += '<div class="yak-pick">'
        + '<span class="k">상품</span><select id="yak-prod-sel">' + products.map((p, i) => '<option value="' + i + '"' + (i === prodIdx ? ' selected' : '') + '>'
          + escapeHtml(shortProd(p)) + ' · 판매 ' + ymd(p.slStDt) + '~' + ymd(p.slEdDt) + '</option>').join("") + '</select>'
        + '<span class="k">청구 담보</span><select id="yak-clause-sel">'
        + (near.length ? '<optgroup label="청구 담보와 가까운 특약">' + near.map(opt).join("") + '</optgroup><optgroup label="전체 (약관 순서)">' : '')
        + doc.clauses.map((c, i) => opt(i)).join("") + (near.length ? '</optgroup>' : '') + '</select>'
        + '<span class="links"><a href="' + pdfLink + '" target="_blank" rel="noopener">약관 PDF 원문 (p.' + doc.pageOf(clause.at) + ') ↗</a>'
        + '<a href="' + HI_URL + '/serviceAction.do?menuId=100932" target="_blank" rel="noopener">현대해상 공시실 ↗</a>'
        + '<span class="kcd-en">' + doc.pages + '쪽 · 특약 ' + (doc.clauses.length - 1) + '개</span></span></div>';
      const artHtml = (a, from) => '<div class="yak-art' + (from ? ' from' : '') + '"><div class="at">' + escapeHtml((a.label || "") + " (" + a.title + ")")
        + '<span class="ref">p.' + a.page + '</span></div><div class="tx">' + escapeHtml(a.body) + '</div></div>';
      const box = (cls, title, list, extra) => '<div class="yak-box ' + cls + '"><h3>' + title + (extra || '') + '</h3>'
        + (list.length ? list.map(a => artHtml(a) + yakFollowRefs(doc, a).map(r => artHtml(r, true)).join("")).join("") : '<p class="kcd-en">이 특약에는 해당 조항이 없어요.</p>') + '</div>';
      html += '<div class="yak-panel">'
        + box("pay", "지급사유", groups.pay, kcd ? '<span class="yak-kcd">KCD ' + kcd[1] + '차 기준</span>' : '')
        + box("limit", "지급 제한사유", groups.limit)
        + (groups.crit.length ? box("crit", "판단 기준 (정의·진단확정 등)", groups.crit) : '')
        + '</div>';
      if (groups.other.length) html += '<details class="yak-other"><summary>그 밖의 조항 ' + groups.other.length + '개 (' + escapeHtml(groups.other.map(a => a.title).slice(0, 4).join(", ")) + (groups.other.length > 4 ? " …" : "") + ')</summary>'
        + '<div class="yak-box">' + groups.other.map(a => artHtml(a)).join("") + '</div></details>';
      html += '<p class="crit-src">출처: 현대해상 공시실 ' + escapeHtml(doc.fileName || prod.prodNm) + '. 조항은 약관 PDF에서 글자만 뽑은 원문이라 표는 줄글로 보여요. 지급 판단 전 원문을 확인하세요.</p>';
      document.getElementById("yak-live").innerHTML = html;
      document.getElementById("yak-std").open = false;
      const result = { prod, clause, groups, pdfLink, kcd: kcd ? kcd[1] : "", follow: groups.limit.flatMap(a => yakFollowRefs(doc, a)) };
      yakState.result = result;
      yakAfter(result);
      return result;
    }

    // 결과가 나오면 메뉴 미리보기·카드뉴스 1장(약관)에 반영
    function yakAfter(r) {
      const pay = r.groups.pay[0];
      const limits = r.groups.limit.map(a => a.label).concat(r.follow.map(f => f.label));
      setPreview("yakgwan", [
        ["상품", r.prod.prodNm.replace(/^무배당\s*/, "").replace(/현대해상/, "")],
        ["담보", r.clause.name, r.clause.no],
        ["지급사유", pay ? yakFirstSentence(pay.body) : "조항 없음", pay ? pay.label : "", true],
        ["제한", limits.length ? limits.join(" → ") : "별도 조항 없음"]
      ]);
      fillYakCard(r);
    }
    function fillYakCard(r) {
      const back = cnTab !== "exempt" ? [cnTab, cnSub] : null;
      if (back) switchCardNews("exempt", Object.keys(CN_SETS.exempt.subs).includes(lastExemptSub) ? lastExemptSub : "진단부적정");
      const pay = r.groups.pay[0];
      setCard(0, 0, r.clause.name);
      if (pay) setCard(0, 1, shorten(yakFirstSentence(pay.body), 40) + " (" + pay.label + ")");
      const lim = r.groups.limit[0];
      if (lim) setCard(0, 2, shorten((r.follow[0] ? r.follow[0].label + ": " + yakFirstSentence(r.follow[0].body.replace(/^①\s*/, "")) : yakFirstSentence(lim.body)), 40));
      setCardLink(0, r.pdfLink);
      saveCardNews();
      if (back) switchCardNews(back[0], back[1]);
    }

    document.getElementById("yak-form").addEventListener("submit", e => {
      e.preventDefault();
      yakRun(document.getElementById("yak-product").value.trim(), document.getElementById("yak-date").value, document.getElementById("yak-cover").value.trim());
    });
    document.getElementById("yak-live").addEventListener("change", async e => {
      if (e.target.id === "yak-clause-sel") { yakState.clauseIdx = Number(e.target.value); yakRender(); }
      if (e.target.id === "yak-prod-sel") {
        const run = ++yakState.run;
        try { await yakOpenProduct(Number(e.target.value), run); }
        catch (err) { if (run === yakState.run) yakStatus(err.message, null, true); }
      }
    });

    // ===== 분쟁조정: 금감원 분쟁조정정보 5개 게시판(보험 분야)을 입력 정보로 골라 한 화면에 =====
    // 데이터는 FSS분쟁조정 폴더 파일을 gzip으로 줄여 FSS_PACKED(앞 script)에 넣어 두고 처음에 한 번 풂
    // 항목: { b: 게시판, id, type: 유형, title, date, sum: 요지, q: 쟁점, a: 결론, res: "ok"|"no"|"", url, body: 본문 }
    const FSS_BOARDS = [
      { key: "decision", label: "분쟁조정결정례", short: "결정례", list: "https://www.fss.or.kr/fss/bbs/B0000390/list.do?menuNo=201193" },
      { key: "standard", label: "분쟁해결기준", short: "해결기준", list: "https://www.fss.or.kr/fss/job/fncCnflPrcdnt/list.do?menuNo=201194&rgnlCode=B" },
      { key: "case", label: "분쟁조정사례", short: "사례", list: "https://www.fss.or.kr/fss/job/fncCnflCase/list.do?menuNo=201195&rgnlCode=B" },
      { key: "precedent", label: "주요판례", short: "판례", list: "https://www.fss.or.kr/fss/job/fncCnflMainPrcdnt/list.do?menuNo=201196&rgnlCode=B" },
      { key: "notice", label: "소비자 유의사항", short: "유의사항", list: "https://www.fss.or.kr/fss/job/fncCnflNewsData/list.do?menuNo=201197&rgnlCode=B" }
    ];
    let fssData = null;
    const fssReady = unpackGzip(FSS_PACKED.items).then(t => {
      fssData = JSON.parse(t).map(x => Object.assign(x, { flat: (x.title + " " + x.type + " " + x.sum + " " + x.q + " " + x.a).replace(/\s+/g, ""), bodyFlat: (x.body || "").replace(/\s+/g, "") }));
      return fssData;
    }).catch(err => { console.error(err); return null; });

    // 진단코드 → 분쟁 자료에서 쓰는 질환 단어
    const FSS_DISEASE_WORDS = [
      [/^I6/, ["뇌혈관", "뇌졸중", "뇌경색", "뇌출혈"]], [/^I2[0-5]/, ["심근경색", "협심증", "허혈성심장", "심혈관"]],
      [/^(C|D0)/, ["암", "악성신생물"]], [/^D3[7-9]|^D4[0-8]/, ["경계성종양", "행동양식불명"]], [/^D[1-3]/, ["양성종양"]],
      [/^E1[0-4]/, ["당뇨"]], [/^F/, ["정신", "우울"]], [/^M5[0-4]/, ["디스크", "추간판", "척추"]], [/^[ST]/, ["상해", "골절"]],
      [/^G/, ["신경"]], [/^K/, ["소화기"]], [/^O/, ["임신", "출산"]], [/^N/, ["신장"]], [/^J/, ["폐", "호흡기"]]
    ];
    // 담보명 → 단어
    const FSS_COVER_WORDS = [
      [/진단/, "진단"], [/입원/, "입원"], [/수술/, "수술"], [/사망/, "사망"], [/장해/, "장해"], [/(실손|의료비)/, "실손"],
      [/(상해|재해)/, "상해"], [/(간병|요양)/, "간병"], [/통원/, "통원"], [/일당/, "일당"], [/항암/, "항암"]
    ];

    // 입력 정보 → [단어, 무게, 출처] 목록 (쟁점 3 · 질환 2 · 담보 1.5 · 직업 2)
    function fssTermsFromCase(v) {
      const terms = [];
      const add = (w, wt, src) => { w = (w || "").replace(/\s+/g, ""); if (w.length >= 2 && !terms.some(t => t[0] === w)) terms.push([w, wt, src]); };
      (v.issue || "").split(/[\s,·/]+/).forEach(w => add(w, 3, "쟁점"));
      if (v.code) {
        const code = normCode(v.code);
        const meta = KCD[code] || KCD[code.slice(0, 3)];
        if (meta) add(meta.kw, 2, "질환");
        const name = koicdName(code) || koicdName(code.slice(0, 3));
        if (name) add(name.replace(/(의|및|기타|상세불명|으로|명시되지 않은)/g, " ").split(/\s+/).sort((a, b) => b.length - a.length)[0], 2, "질환");
        FSS_DISEASE_WORDS.filter(([re]) => re.test(code)).forEach(([, ws]) => ws.forEach(w => add(w, 2, "질환")));
      }
      if (v.cover) {
        // 담보 유형 단어(실손·진단·장해…)를 담보명 그대로보다 무겁게: 금감원 글은 '실손의료비'보다 '실손보험금'처럼 씀
        FSS_COVER_WORDS.filter(([re]) => re.test(v.cover)).forEach(([, w]) => add(w, 2, "담보"));
        add(v.cover.replace(/(보장)?(특별약관|특약)$/, "").replace(/(진단비|입원일당|입원비|수술비|보험금|보장|담보)$/, ""), 1.5, "담보");
      }
      // 직업은 상해 담보이거나 쟁점에 직업·통지가 있을 때만 (진단비 사건에 직업 자료가 섞이지 않게)
      if (v.job && (/(상해|재해|사망|장해)/.test(v.cover || "") || /(직업|통지)/.test(v.issue || ""))) { add("직업", 2, "직업"); add("통지의무", 2, "직업"); }
      // 한 단어가 다른 단어를 품으면 하나만 남김 (심근경색 ⊂ 급성심근경색): 무게가 큰 쪽, 같으면 짧은 쪽
      const covers = (a, b) => a[0].includes(b[0]) || b[0].includes(a[0]);
      return terms.filter(t => !terms.some(o => o !== t && covers(o, t) && (o[1] > t[1] || (o[1] === t[1] && o[0].length < t[0].length))));
    }

    // 점수: 제목·요지·쟁점·결론에 있으면 무게만큼, 본문에만 있으면 절반
    // 2점 미만이거나 1등 점수의 35%에 못 미치는 약한 자료는 뺌
    function rankFss(terms) {
      const scored = fssData.map(x => {
        let score = 0;
        const hit = [];
        terms.forEach(([w, wt]) => {
          if (x.flat.includes(w)) { score += wt; hit.push(w); }
          else if (x.bodyFlat.includes(w)) { score += wt / 2; hit.push(w); }
        });
        return { x, score, hit };
      });
      const top = Math.max(0, ...scored.map(s => s.score));
      return scored.filter(s => s.score >= Math.max(2, top * 0.35)).sort((a, b) => b.score - a.score || b.x.date.localeCompare(a.x.date));
    }

    let fssState = { terms: [], ranked: [], tab: "case", shown: {} };

    async function runFssSearch(query, v) {
      const box = document.getElementById("fss-result");
      if (!fssData) box.innerHTML = '<div class="kcd-box">분쟁조정 자료를 불러오는 중…</div>';
      await fssReady;
      if (!fssData) { box.innerHTML = '<div class="kcd-box">자료를 불러오지 못했어요. 최신 Chrome·Edge·Safari에서 열어 주세요.</div>'; return []; }
      let terms = v ? fssTermsFromCase(v) : [];
      if (query && query.trim()) terms = query.trim().split(/[\s,·/]+/).filter(w => w.length >= 2).map(w => [w, 3, "검색"]);
      document.getElementById("fss-query").value = terms.filter(t => t[1] >= 2).map(t => t[0]).slice(0, 6).join(" ");
      const ranked = terms.length ? rankFss(terms) : fssData.map(x => ({ x, score: 0, hit: [] })).sort((a, b) => b.x.date.localeCompare(a.x.date));
      // 처음 여는 탭: 가장 잘 맞는 자료가 있는 게시판 (입력이 없으면 분쟁조정사례)
      const first = terms.length && ranked.length ? ranked[0].x.b : "case";
      fssState = { terms, ranked, tab: first, shown: {} };
      renderFssResult();
      return ranked;
    }

    function renderFssResult() {
      const { terms, ranked, tab } = fssState;
      const box = document.getElementById("fss-result");
      const counts = {};
      FSS_BOARDS.forEach(b => { counts[b.key] = ranked.filter(r => r.x.b === b.key).length; });
      let html = '';
      html += '<div class="fss-terms">' + (terms.length
        ? '<span>검색어</span>' + terms.map(t => '<span class="t" title="' + t[2] + '">' + escapeHtml(t[0]) + '</span>').join("")
        : '<span>처음 화면에 사건 정보를 넣으면 맞는 자료를 골라 보여 줘요. 지금은 게시판별 최신 자료예요.</span>') + '</div>';
      html += '<div class="fss-overview">' + FSS_BOARDS.map(b => '<button type="button" data-fss-tab="' + b.key + '" class="'
        + (b.key === tab ? 'on' : '') + (counts[b.key] ? '' : ' zero') + '"><span class="n">' + counts[b.key] + '</span><span class="l">' + b.label + '</span></button>').join("") + '</div>';
      const board = FSS_BOARDS.find(b => b.key === tab);
      const list = ranked.filter(r => r.x.b === tab);
      const limit = fssState.shown[tab] || 10;
      const searchWord = terms.length ? terms.slice().sort((a, b) => b[1] - a[1])[0][0] : "";
      const liveUrl = board.list + (searchWord ? "&searchCnd=1&searchWrd=" + encodeURIComponent(searchWord) : "");
      html += '<div class="fss-more"><span>' + board.label + ' ' + list.length + '건' + (terms.length ? ' · 맞는 정도 순' : ' · 최신순') + '</span>'
        + '<a href="' + liveUrl + '" target="_blank" rel="noopener">금감원에서 최신 글 검색 ↗</a></div>';
      if (!list.length) html += '<p class="none">이 게시판에는 맞는 자료가 없어요.</p>';
      html += list.slice(0, limit).map(r => fssCard(r)).join("");
      if (list.length > limit) html += '<div class="fss-more"><span></span><button type="button" data-fss-more="1">' + Math.min(10, list.length - limit) + '건 더 보기</button></div>';
      html += '<p class="kcd-src">출처: 금융감독원 분쟁조정정보 (보험 분야, ' + FSS_PACKED.date + ' 기준). 그 뒤에 올라온 글은 위의 "금감원에서 최신 글 검색"으로 확인하세요.</p>';
      box.innerHTML = html;
    }

    function fssCard({ x, hit }) {
      const badge = x.res === "ok" ? '<span class="badge ok">지급·지급 권고</span>' : x.res === "no" ? '<span class="badge no">부지급 정당</span>' : '';
      const line = (k, t) => t ? '<div class="line"><b>' + k + '</b><span>' + escapeHtml(t) + '</span></div>' : '';
      return '<div class="fss-item"><div class="head">' + (x.type ? '<span class="tag">' + escapeHtml(x.type) + '</span>' : '')
        + '<span>' + x.date.replace(/-/g, ".") + '</span>' + badge
        + (hit.length ? '<span class="why">일치: ' + escapeHtml(hit.slice(0, 3).join(", ")) + '</span>' : '') + '</div>'
        + '<div class="title">' + escapeHtml(x.title) + '</div>'
        + line("요지", x.sum) + line("쟁점", x.q) + line("결론", x.a)
        + (x.body ? '<details><summary>본문 보기</summary><div class="full">' + escapeHtml(x.body) + '</div></details>' : '')
        + '<div class="foot"><a href="' + x.url + '" target="_blank" rel="noopener">원문 보기 ↗</a>'
        + (x.b === "decision" ? '<span class="kcd-en">본문은 금감원 첨부파일(한글)로 제공돼요</span>' : '') + '</div></div>';
    }

    document.getElementById("fss-result").addEventListener("click", e => {
      const t = e.target.closest("[data-fss-tab]");
      if (t) { fssState.tab = t.dataset.fssTab; renderFssResult(); return; }
      if (e.target.closest("[data-fss-more]")) { fssState.shown[fssState.tab] = (fssState.shown[fssState.tab] || 10) + 10; renderFssResult(); }
    });
    runFssSearch("", null);
    // 진단코드 입력칸 자동완성 목록 (KCD 9차 3단위 코드는 분류표를 푼 뒤 loadKoicd가 채움)
    document.getElementById("kcd-list").innerHTML = Object.keys(KCD)
      .map(code => '<option value="' + code + '">' + KCD[code].name + '</option>').join("");

    // 쟁점 → PubMed 영어 검색어 보충
    const ISSUE_EN = { "외래성": "sudden death", "우연성": "accident", "진단확정": "diagnosis", "입원 필요성": "hospitalization", "장해 고정": "disability", "암 분류": "classification" };

    const CASE_INPUT_IDS = { product: "in-product", date: "in-date", job: "in-job", code: "in-code", cover: "in-cover", issue: "in-issue" };
    const CASE_STORAGE_KEY = "caseInput_v1";

    function readCaseInput() {
      const v = {};
      Object.keys(CASE_INPUT_IDS).forEach(k => { v[k] = document.getElementById(CASE_INPUT_IDS[k]).value.trim(); });
      v.code = v.code.toUpperCase();
      return v;
    }

    // 입력값은 이 브라우저에 기억해 두었다가 다시 열 때 채움
    (function restoreCaseInput() {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(CASE_STORAGE_KEY)); } catch (e) { saved = null; }
      if (!saved) return;
      Object.keys(CASE_INPUT_IDS).forEach(k => { if (saved[k]) document.getElementById(CASE_INPUT_IDS[k]).value = saved[k]; });
    })();

    // ===== 처음 화면: 상품명·가입일을 넣으면 바로 공시실 약관을 받아 두고, 담보명은 그 약관의 담보 중에서만 고르게 함 =====
    // state: idle(상품명 없음) · loading(약관 받는 중, 담보명 잠금) · ready(약관 담보만 허용) · free(약관을 못 찾음, 직접 입력)
    const introYak = { key: "", run: 0, products: [], prodIdx: 0, doc: null, state: "idle", note: "", error: "" };

    function introYakBox(html) {
      const b = document.getElementById("intro-yak");
      b.hidden = !html;
      b.innerHTML = html || "";
    }

    async function introYakLoad(prodIdx) {
      const product = document.getElementById("in-product").value.trim();
      const date = document.getElementById("in-date").value;
      const key = product + "|" + date;
      if (!product) {
        Object.assign(introYak, { key: "", products: [], doc: null, state: "idle" });
        introCoverMode(); introYakBox(""); return;
      }
      if (key === introYak.key && prodIdx === undefined && introYak.state !== "free") return;  // 이미 받는 중이거나 받음
      const run = ++introYak.run;
      Object.assign(introYak, { key, state: "loading", doc: null, error: "" });
      introCoverMode();
      const say = (t, p) => {
        if (run !== introYak.run) return;
        introYakBox('<div class="row"><span>' + escapeHtml(t) + '</span>' + (p != null ? '<span class="bar"><i style="width:' + Math.round(p) + '%"></i></span>' : '') + '</div>');
      };
      try {
        say("현대해상 공시실에서 '" + product + "' 약관 찾는 중…", 5);
        const { list, note } = await yakFindProducts(product, date);
        if (run !== introYak.run) return;
        if (!list.length) throw new Error("공시실에서 '" + product + "' 상품을 찾지 못했어요. 상품명을 줄여서(예: 퍼펙트플러스) 다시 넣거나, 담보명을 직접 적어 주세요.");
        Object.assign(introYak, { products: list, note, prodIdx: prodIdx >= 0 && prodIdx < list.length ? prodIdx : 0 });
        const doc = await yakLoadDoc(list[introYak.prodIdx], null, say);
        if (run !== introYak.run) return;
        if (doc.clauses.length < 2) throw new Error("약관 글자를 읽지 못했어요(스캔 이미지 약관일 수 있어요). 담보명을 직접 적어 주세요.");
        Object.assign(introYak, { doc, state: "ready" });
      } catch (err) {
        if (run !== introYak.run) return;
        Object.assign(introYak, { state: "free", error: err.message });
      }
      introCoverMode();
      introRender();
      if (document.getElementById("in-cover").value.trim()) introValidateCover();
    }

    // 담보명 칸: 상태에 따라 잠금·안내 문구·고를 수 있는 목록을 바꿈
    function introCoverMode() {
      const input = document.getElementById("in-cover");
      const list = document.getElementById("intro-cover-list");
      const st = introYak.state;
      input.disabled = st === "loading";
      input.placeholder = { idle: "상품명을 넣으면 약관의 담보에서 골라요", loading: "약관 불러오는 중…", ready: "약관의 담보 중에서 고르세요 (예: 급성심근경색)", free: "담보명을 직접 적어 주세요" }[st];
      list.innerHTML = st === "ready" ? yakCoverages(introYak.doc).map(c => '<option value="' + escapeHtml(c.name) + '">' + escapeHtml(c.no) + '</option>').join("") : "";
      if (st !== "ready") input.classList.remove("bad");
    }

    function introRender(msgHtml) {
      if (introYak.state === "free") { introYakBox('<div class="row"><span class="err">!</span><span>' + escapeHtml(introYak.error) + '</span></div>'); return; }
      if (introYak.state !== "ready") return;
      const { products, prodIdx, doc, note } = introYak;
      const ymd = s => (s || "").trim().replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
      let html = '<div class="row"><span class="ok">✓ 약관을 불러왔어요</span><span>청구할 수 있는 담보 ' + yakCoverages(doc).length + '개 · 담보명은 이 중에서만 고를 수 있어요</span></div>';
      html += '<div class="row"><span>상품 버전</span><select id="intro-prod-sel">' + products.map((p, i) => '<option value="' + i + '"' + (i === prodIdx ? ' selected' : '') + '>'
        + escapeHtml(p.prodNm.replace(/^무배당\s*/, "").replace(/현대해상/, "")) + ' · 판매 ' + ymd(p.slStDt) + '~' + ymd(p.slEdDt) + '</option>').join("") + '</select></div>';
      if (note) html += '<div class="row"><span class="err">!</span><span>' + escapeHtml(note) + '</span></div>';
      html += '<div id="intro-cover-msg">' + (msgHtml || "") + '</div>';
      introYakBox(html);
    }

    // 담보명이 약관의 담보와 같은지 확인. 아니면 비슷한 담보를 골라 쓸 수 있게 보여 주고 false
    function introValidateCover() {
      const input = document.getElementById("in-cover");
      if (introYak.state !== "ready") return true;
      const v = input.value.replace(/\s+/g, "");
      const covs = yakCoverages(introYak.doc);
      const exact = v ? covs.find(c => c.name === v) : null;
      const ok = !v || !!exact;
      input.classList.toggle("bad", !ok);
      if (exact) input.value = exact.name;
      const near = ok ? [] : covs.map(c => ({ c, s: yakScore(v, c.name) })).sort((a, b) => b.s - a.s).slice(0, 5);
      const msg = ok ? "" : '<div class="row"><span class="err">약관에 없는 담보예요.</span><span>이 중에서 고르세요:</span></div><div class="row">'
        + near.map(n => '<button type="button" class="chip" data-cover="' + escapeHtml(n.c.name) + '">' + escapeHtml((n.c.no ? n.c.no + " " : "") + n.c.name) + '</button>').join("") + '</div>';
      const box = document.getElementById("intro-cover-msg");
      if (box) box.innerHTML = msg;
      return ok;
    }

    document.getElementById("in-product").addEventListener("change", () => introYakLoad());
    document.getElementById("in-date").addEventListener("change", () => introYakLoad());
    document.getElementById("in-cover").addEventListener("change", introValidateCover);
    document.getElementById("in-cover").addEventListener("input", () => {
      // 목록에서 고르면 바로 맞는지 확인 (타이핑 중에는 빨간 표시만 지움)
      const input = document.getElementById("in-cover");
      if (introYak.state === "ready" && yakCoverages(introYak.doc).some(c => c.name === input.value.replace(/\s+/g, ""))) introValidateCover();
      else input.classList.remove("bad");
    });
    document.getElementById("intro-yak").addEventListener("click", e => {
      const chip = e.target.closest("[data-cover]");
      if (!chip) return;
      document.getElementById("in-cover").value = chip.dataset.cover;
      introValidateCover();
    });
    document.getElementById("intro-yak").addEventListener("change", e => {
      if (e.target.id === "intro-prod-sel") introYakLoad(Number(e.target.value));
    });
    // 저장해 둔 상품명이 있으면 열자마자 약관을 받기 시작
    introYakLoad();

    // 판례 탭 분류 정하기: 상해·재해사망/장해 담보면 담보명 우선, 그 밖에는 진단코드 우선
    function guessCategory(v) {
      if (/사망/.test(v.cover) && /(상해|재해)/.test(v.cover)) return "상해사망";
      if (/장해/.test(v.cover)) return "장해";
      const info = KCD[v.code];
      if (info) return info.cat;
      if (/^I6/.test(v.code)) return "뇌혈관질환";
      if (/^I2/.test(v.code)) return "심혈관질환";
      if (/^(C|D0|D3|D4)/.test(v.code)) return "암";
      if (/^[ST]/.test(v.code)) return "상해사망";
      const c = v.cover;
      if (/장해/.test(c)) return "장해";
      if (/사망/.test(c) && /(상해|재해)/.test(c)) return "상해사망";
      if (/뇌/.test(c)) return "뇌혈관질환";
      if (/암/.test(c)) return "암";
      if (/(심근|심장|협심)/.test(c)) return "심혈관질환";
      return null;
    }

    function setText(id, text) { document.getElementById(id).textContent = text; }

    // 메뉴 미리보기: [항목명, 값, 강조할 앞부분?, 두 줄 허용?] 줄들을 "항목명 | 값"으로 그림
    function setPreview(key, rows) {
      const box = document.getElementById("ar-" + key);
      box.innerHTML = "";
      rows.filter(r => r && r[1]).forEach(([k, v, strong, long]) => {
        const ks = document.createElement("span");
        ks.className = "k";
        ks.textContent = k;
        const vs = document.createElement("span");
        vs.className = "v" + (long ? " long" : "");
        vs.title = (strong ? strong + " " : "") + v;
        if (strong) { const b = document.createElement("b"); b.textContent = strong + " "; vs.appendChild(b); }
        vs.appendChild(document.createTextNode(v));
        box.append(ks, vs);
      });
    }

    function runAutoSearch() {
      const v = readCaseInput();
      try { localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(v)); } catch (e) {}
      const info = KCD[v.code];
      const any = Object.values(v).some(Boolean);

      // 입력 요약: 항목별 칩
      const codeName = v.code ? koicdName(normCode(v.code)) : "";
      const parts = [
        ["상품", v.product], ["가입일", v.date.replace(/-/g, ".")], ["기고지 직업", v.job],
        ["진단", v.code ? normCode(v.code) + (codeName ? " " + codeName : "") : ""], ["담보", v.cover], ["쟁점", v.issue]
      ].filter(p => p[1]);
      const summary = document.getElementById("case-summary");
      summary.innerHTML = "";
      parts.forEach(([k, val]) => {
        const s = document.createElement("span");
        const i = document.createElement("i");
        i.textContent = k;
        s.append(i, val);
        summary.appendChild(s);
      });
      ["yakgwan", "koicd", "law", "pubmed", "fss", "cardnews"].forEach(k => setText("ar-" + k, ""));
      if (!any) { runFssSearch("", null); return; }

      // 1) 약관: 상품명이 있으면 공시실에서 가입 당시 약관을 받아 청구 담보 조항을 따옴 (끝나면 미리보기·카드뉴스 반영)
      //    표준약관 기준(아래)은 상품명이 없거나 약관을 못 찾았을 때 참고용
      yakJob = v.job;
      const yakGroup = guessYakGroup(v.cover);
      if (yakGroup) yakCurrent = yakGroup;
      renderYak();
      yakRun(v.product, v.date, v.cover, introYak.key === v.product + "|" + v.date ? introYak.prodIdx : 0);
      if (v.product) {
        setPreview("yakgwan", [["상품", v.product], ["약관", "현대해상 공시실에서 찾는 중…"]]);
      } else if (yakGroup || v.job) {
        const g = YAK_GROUPS[yakCurrent];
        const limitCount = g.limits.length + YAK_COMMON_LIMITS.length + (g.injury ? YAK_INJURY_LIMITS.length + YAK_JOB_LIMITS.length : 0);
        setPreview("yakgwan", [
          ["담보 유형", yakCurrent],
          ["확인 항목", "지급사유 " + g.pay.length + "개 · 제한사유 " + limitCount + "개"],
          ["주의", v.job && g.injury ? "직업 변경 통지의무 (기고지: " + v.job + ")" : ""]
        ]);
      }

      // 2) KOICD: 진단코드의 분류·관련 코드·코딩지침을 미리 찾아 둠
      if (v.code) {
        showKoicd(v.code);
        const code = normCode(v.code);
        koicdReady.then(() => { if (koicd) setPreview("koicd", koicdPreview(code)); });
      }

      // 3) 판례: 파일에 저장된 판례에서 분류·쟁점으로 찾기
      const cat = guessCategory(v);
      const words = [v.issue, info && info.kw].filter(Boolean)
        .join(" ").split(/[\s,·]+/).filter(w => w.length >= 2);
      const pool = CASES.filter(c => !cat || c.category === cat);
      // 쟁점 단어가 맞으면 2점, 진단명 단어가 맞으면 1점 (쟁점이 더 중요)
      const issueWords = (v.issue || "").split(/[\s,·]+/).filter(w => w.length >= 2);
      const scored = pool.map(c => {
        const text = [c.title, c.summary, c.type, c.issue].filter(Boolean).join(" ");
        const score = words.reduce((s, w) => s + (text.includes(w) ? (issueWords.includes(w) ? 2 : 1) : 0), 0);
        return { c, score };
      }).sort((a, b) => b.score - a.score);
      const hits = words.length ? scored.filter(s => s.score > 0) : scored;
      const best = (hits[0] || scored[0] || {}).c;
      // 판례 탭 검색창에는 쟁점 단어를 넣되, 그 분류에 걸리는 판례가 있을 때만
      const issueWord = v.issue ? v.issue.split(/[\s,·]+/)[0] : "";
      const issueHit = issueWord && pool.some(c => [c.title, c.summary, c.type, c.issue].filter(Boolean).join(" ").includes(issueWord));
      lawPreset = { cat, keyword: issueHit ? issueWord : "", live: info ? info.kw + " 보험금" : "" };
      if (cat || words.length) {
        setPreview("law", [
          ["관련 판례", (cat ? cat + " " : "") + (hits.length || pool.length) + "건"],
          ["대표 판례", best ? best.title : "", best ? best.caseNo : "", true]
        ]);
      }

      // 4) 의학 논문: PubMed 검색어를 만들고 건수·대표 논문을 가져옴 (인터넷 필요)
      const enTerms = [info && info.en, ISSUE_EN[v.issue]].filter(Boolean);
      const pubQuery = enTerms.length ? enTerms.join(" ") : (v.code || "");
      document.getElementById("pubmed-query").value = pubQuery;
      if (pubQuery) {
        setPreview("pubmed", [["검색어", pubQuery], ["논문", "검색 중…"]]);
        const base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
        fetch(base + "esearch.fcgi?db=pubmed&retmode=json&retmax=1&sort=relevance&term=" + encodeURIComponent(pubQuery))
          .then(r => r.json())
          .then(j => {
            const count = Number(j.esearchresult.count).toLocaleString("ko-KR");
            const id = j.esearchresult.idlist[0];
            if (!id) { setPreview("pubmed", [["검색어", pubQuery], ["논문", "0건"]]); return; }
            return fetch(base + "esummary.fcgi?db=pubmed&retmode=json&id=" + id)
              .then(r => r.json())
              .then(s => {
                const doc = s.result[id];
                setPreview("pubmed", [
                  ["검색어", pubQuery],
                  ["논문", count + "건"],
                  ["대표 논문", doc.title, (doc.pubdate || "").slice(0, 4)]
                ]);
                fillPaperCard(doc, id, count, pubQuery);
              });
          })
          .catch(() => setPreview("pubmed", [["검색어", pubQuery], ["논문", "인터넷 연결 후 확인"]]));
      }

      // 5) 분쟁조정: 금감원 5개 게시판(보험)에서 입력 정보로 맞는 자료를 골라 둠
      runFssSearch("", v);
      const fssTop = fssData ? rankFss(fssTermsFromCase(v)) : [];
      const fssPreview = ranked => {
        if (!ranked.length) { setPreview("fss", [["관련 자료", "맞는 자료 없음"]]); return; }
        const counts = FSS_BOARDS.map(b => [b.short, ranked.filter(r => r.x.b === b.key).length]).filter(c => c[1]);
        // 미리보기는 결론이 있는 분쟁조정사례·해결기준을 우선
        const best = (ranked.find(r => r.x.b === "standard" || (r.x.b === "case" && r.x.a)) || ranked[0]).x;
        setPreview("fss", [
          ["관련 자료", counts.map(c => c[0] + " " + c[1]).join(" · ")],
          ["대표", best.title, FSS_BOARDS.find(b => b.key === best.b).short, true],
          ["결론", best.a || best.sum, best.res === "ok" ? "지급" : best.res === "no" ? "부지급" : "", true]
        ]);
      };
      if (fssData) fssPreview(fssTop);
      else fssReady.then(() => { if (fssData) fssPreview(rankFss(fssTermsFromCase(v))); });

      // 6) 카드뉴스: 탭 3개에 입력값과 검색 결과를 반영
      // 쟁점으로 세부 유형과 처음 보여 줄 탭을 고름
      const issueText = v.issue || "";
      const exemptSub = /가입/.test(issueText) ? "가입전진단" : "진단부적정";
      const discloseSub = /해지/.test(issueText) ? "해지" : /(변경|부담보)/.test(issueText) ? "계약변경" : "면책";
      const notifySub = /(요청|변경 요청|계약변경)/.test(issueText) ? "직업변경 요청" : "비례보상";
      const showTab = /(고지|알릴)/.test(issueText) ? "disclose" : /(통지|직업)/.test(issueText) ? "notify" : "exempt";
      const setProduct = () => {
        if (v.product) document.querySelectorAll('.cn-meta-value[data-meta="product"]').forEach(el => { el.textContent = v.product; });
      };
      const filled = [];
      if (v.product) filled.push("상품명");

      // 고지의무 위반 탭: 상품명
      switchCardNews("disclose", discloseSub);
      setProduct();
      saveCardNews();
      // 통지의무 위반 탭: 상품명 + 기고지 직업
      switchCardNews("notify", notifySub);
      setProduct();
      if (v.job) { setCard(1, 0, v.job); filled.push("기고지 직업"); }
      saveCardNews();

      // 면책안내 탭 (마지막에 채움: PubMed 결과가 늦게 와도 이 탭에 들어가도록)
      switchCardNews("exempt", exemptSub);
      setProduct();
      // 1장 약관: 담보명 (지급사유·면책 근거는 세부 유형 양식 그대로)
      if (v.cover) { setCard(0, 0, v.cover); filled.push("담보명"); }
      // 3장 KCD: 진단명·코드 + 코딩지침 또는 분류표 포함 기준
      if (v.code) {
        setCard(2, 0, (codeName ? codeName + " " : "") + v.code);
        const gd = relatedGuides(normCode(v.code))[0];
        const crit = gd ? "코딩지침 " + gd.num + " " + gd.title : "KOICD 분류표에서 확인";
        setCard(2, 1, shorten(crit, 44));
        filled.push("KCD");
      }
      // 4장 판례: 대표 판례 + 법제처 링크
      if (best && (v.code || v.cover || v.issue)) {
        setCard(3, 0, "대법원 " + best.caseNo + " · " + best.date);
        setCard(3, 1, shorten(best.title, 40));
        setCardLink(3, "https://www.law.go.kr/precSc.do?menuId=7&query=" + encodeURIComponent(best.caseNo));
        filled.push("판례");
      }
      // 5장 의학논문: PubMed 결과가 오면 fillPaperCard가 채움 (인터넷 없으면 검색어만)
      if (pubQuery) {
        setCard(4, 0, "PubMed '" + pubQuery + "' 검색");
        setCard(4, 1, "인터넷 연결 후 대표 논문 확인");
        setCardLink(4, "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(pubQuery));
        filled.push("의학논문");
      }
      // 6장 분쟁조정: 결론이 있는 가장 맞는 자료(사례·해결기준 우선)
      const fssCardTop = (fssTop.find(r => r.x.b === "standard" || (r.x.b === "case" && r.x.a)) || fssTop[0] || {}).x;
      if (fssCardTop) {
        setCard(5, 0, "금융감독원 " + FSS_BOARDS.find(b => b.key === fssCardTop.b).label + " · " + fssCardTop.date.replace(/-/g, "."));
        setCard(5, 1, shorten(fssCardTop.a || fssCardTop.sum || fssCardTop.title, 44));
        setCardLink(5, fssCardTop.url);
        filled.push("분쟁조정");
      }
      saveCardNews();
      // 쟁점에 맞는 탭을 열어 둠 (저장된 내용으로 다시 그려짐)
      if (showTab !== "exempt") switchCardNews(showTab, showTab === "disclose" ? discloseSub : notifySub);
      if (filled.length) {
        setPreview("cardnews", [
          ["양식", CN_SETS[showTab].label + " · " + cnSub],
          ["자동 반영", filled.length + "개 항목 (" + filled.join(", ") + ")"]
        ]);
      }
    }

    // ----- 카드뉴스 채우기 도우미 -----
    function shorten(text, max) { return text.length > max ? text.slice(0, max) + "…" : text; }
    function setCard(cardIdx, itemIdx, value) {
      const card = document.querySelectorAll(".cn-card")[cardIdx];
      const span = card && card.querySelectorAll(".cn-item-text span")[itemIdx];
      if (span && value) span.textContent = value;
    }
    // 카드 아래 원문 링크 주소 바꾸기 (주소 칸의 input 이벤트로 링크·저장까지 처리)
    function setCardLink(cardIdx, url) {
      const card = document.querySelectorAll(".cn-card")[cardIdx];
      const input = card && card.parentElement.querySelector(".cn-link-url");
      if (!input) return;
      input.value = url;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    // PubMed 대표 논문이 오면 5장에 반영
    // (의학논문 카드는 면책안내 탭에만 있으므로, 다른 탭을 보고 있으면 잠깐 바꿔 채우고 돌아옴)
    function fillPaperCard(doc, pmid, count, query) {
      const back = cnTab !== "exempt" ? [cnTab, cnSub] : null;
      if (back) switchCardNews("exempt", Object.keys(CN_SETS.exempt.subs).includes(lastExemptSub) ? lastExemptSub : "진단부적정");
      setCard(4, 0, shorten(doc.title, 70) + " (" + (doc.pubdate || "").slice(0, 4) + ")");
      setCard(4, 1, "PubMed '" + query + "' " + count + "건 중 관련도 1위");
      setCardLink(4, "https://pubmed.ncbi.nlm.nih.gov/" + pmid + "/");
      saveCardNews();
      if (back) switchCardNews(back[0], back[1]);
    }

    // 판례 메뉴를 누르면 자동검색한 분류·검색어로 판례 탭을 맞춤
    let lawPreset = null;
    document.querySelector('.menu-item[data-go="law"]').addEventListener("click", () => {
      if (!lawPreset) return;
      if (lawPreset.cat) {
        const tab = document.querySelector('.tab[data-category="' + lawPreset.cat + '"]');
        if (tab) tab.click();
      }
      searchInput.value = lawPreset.keyword || "";
      render();
      // 진단코드가 있으면 법제처 검색어도 진단명으로 (예: 심근경색 보험금)
      if (lawPreset.live) { liveLawQuery = lawPreset.live; refreshLiveLaw(); }
    });

    // ===================== 사건 타임라인 · 자동 판정 =====================
    // 규칙 근거: 표준약관 질병·상해보험(손해보험 회사용) 제14·15·16·18조, 표준 청약서 질문 기간
    const $ = id => document.getElementById(id);
    const toDate = s => (s ? new Date(s + "T00:00:00") : null);
    const fmt = d => d ? d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0") : "-";
    const addMonths = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const daysBetween = (a, b) => Math.round((b - a) / 86400000);

    // 진료 이력 종류 → 청약서 질문 기간(개월)
    const TL_KINDS = {
      "m3":  { label: "진찰·검사·치료·투약 (3개월)", months: 3, q: "3개월 내 진찰·검사·치료·투약 여부" },
      "y1":  { label: "추가검사·재검사 소견 (1년)", months: 12, q: "1년 내 추가검사(재검사) 여부" },
      "y5":  { label: "입원·수술·7일↑치료·30일↑투약 (5년)", months: 60, q: "5년 내 입원·수술·장기 치료·투약 여부" },
      "y5d": { label: "10대 질병 진단·치료 (5년)", months: 60, q: "5년 내 10대 질병 진단·치료 여부" }
    };

    function addTlRow(data) {
      const d = data || {};
      const row = document.createElement("div");
      row.className = "tl-row";
      row.innerHTML =
        '<input type="date" class="tl-r-date">' +
        '<input type="text" class="tl-r-text" placeholder="내용 (예: 고혈압 진단·약 처방)">' +
        '<select class="tl-r-kind">' + Object.entries(TL_KINDS).map(([k, v]) => '<option value="' + k + '">' + v.label + '</option>').join("") + '</select>' +
        '<label class="inline"><input type="checkbox" class="tl-r-told"> 청약서에 알림</label>' +
        '<label class="inline"><input type="checkbox" class="tl-r-related"> 사고와 관련</label>' +
        '<button type="button" class="tl-del" title="이 줄 삭제">✕</button>';
      row.querySelector(".tl-r-date").value = d.date || "";
      row.querySelector(".tl-r-text").value = d.text || "";
      row.querySelector(".tl-r-kind").value = d.kind || "m3";
      row.querySelector(".tl-r-told").checked = !!d.told;
      row.querySelector(".tl-r-related").checked = !!d.related;
      row.querySelector(".tl-del").addEventListener("click", () => row.remove());
      $("tl-rows").appendChild(row);
    }
    $("tl-addrow").addEventListener("click", () => addTlRow());
    $("tl-today").value = new Date().toISOString().slice(0, 10);
    addTlRow();

    // 처음 화면 입력값(담보명·기고지 직업)을 타임라인에 미리 채움
    document.querySelector('.menu-item[data-go="timeline"]').addEventListener("click", () => {
      const v = readCaseInput();
      if (v.cover && !$("tl-cover").value) $("tl-cover").value = v.cover;
      if (v.job && !$("tl-job0").value) $("tl-job0").value = v.job;
    });

    // 예시 사건: 고혈압 투약 미고지 + 직업 변경 미통지, 뇌출혈 진단
    $("tl-sample").addEventListener("click", () => {
      const set = (id, val) => { $(id).value = val; };
      set("tl-apply", "2024-03-02"); set("tl-start", "2024-03-02"); set("tl-event", "2025-08-20");
      set("tl-today", new Date().toISOString().slice(0, 10)); set("tl-cover", "뇌혈관질환진단비");
      set("tl-waitdays", ""); set("tl-reduceyears", "1"); set("tl-reducerate", "50"); set("tl-diagbasis", "confirm");
      set("tl-known", "2025-09-10"); $("tl-insurerknew").checked = false; $("tl-agentblock").checked = false; $("tl-diagcontract").checked = false;
      set("tl-job0", "사무직"); set("tl-job1", "택배 배송기사"); set("tl-jobdate", "2025-01-15"); set("tl-risk", "up");
      set("tl-rate0", "0.5"); set("tl-rate1", "1.0"); $("tl-notified").checked = false; $("tl-jobrelated").checked = false;
      $("tl-rows").innerHTML = "";
      addTlRow({ date: "2023-05-10", text: "고혈압 진단·혈압약 처방(90일)", kind: "y5d", told: false, related: true });
      addTlRow({ date: "2024-01-20", text: "위내시경 추가검사 소견", kind: "y1", told: false, related: false });
    });

    function readTimeline() {
      return {
        apply: toDate($("tl-apply").value), start: toDate($("tl-start").value), event: toDate($("tl-event").value),
        today: toDate($("tl-today").value) || new Date(), cover: $("tl-cover").value.trim(),
        diagContract: $("tl-diagcontract").checked,
        waitDays: Number($("tl-waitdays").value) || 0, reduceYears: Number($("tl-reduceyears").value) || 0, reduceRate: Number($("tl-reducerate").value) || 0,
        diagBasis: $("tl-diagbasis").value,
        known: toDate($("tl-known").value), insurerKnew: $("tl-insurerknew").checked, agentBlock: $("tl-agentblock").checked,
        job0: $("tl-job0").value.trim(), job1: $("tl-job1").value.trim(), jobDate: toDate($("tl-jobdate").value),
        risk: $("tl-risk").value, rate0: Number($("tl-rate0").value) || 0, rate1: Number($("tl-rate1").value) || 0,
        notified: $("tl-notified").checked, jobRelated: $("tl-jobrelated").checked,
        rows: [...document.querySelectorAll(".tl-row")].map(r => ({
          date: toDate(r.querySelector(".tl-r-date").value), text: r.querySelector(".tl-r-text").value.trim(),
          kind: r.querySelector(".tl-r-kind").value, told: r.querySelector(".tl-r-told").checked, related: r.querySelector(".tl-r-related").checked
        })).filter(r => r.date && r.text)
      };
    }

    // ----- 자동 판정 -----
    let tlLast = null;
    function judgeTimeline(t) {
      const F = [];   // { level: bad|warn|ok|info, title, lines[], tag }
      const isDisease = /(진단|질병|뇌|암|심근|심장|입원|수술)/.test(t.cover) && !/상해/.test(t.cover);
      const out = { exempt: null, disclose: null, notify: null };

      // 1) 보장개시·면책기간·감액기간 (가입전진단)
      if (t.event && t.start) {
        if (t.event < t.start) {
          F.push({ level: "bad", title: "보장개시 전 진단확정 → 면책 검토", lines: [
            "진단확정일 " + fmt(t.event) + "이 책임개시일 " + fmt(t.start) + "보다 " + daysBetween(t.event, t.start) + "일 빠름",
            "보험기간 중 진단확정이 지급사유 (표준약관 제3조)" ] });
          out.exempt = { sub: "가입전진단", reason: "진단확정 " + fmt(t.event) + " < 책임개시 " + fmt(t.start) };
        } else if (t.waitDays && t.event < addDays(t.start, t.waitDays)) {
          F.push({ level: "bad", title: "면책기간(" + t.waitDays + "일) 중 진단 → 면책 검토", lines: [
            "책임개시 " + fmt(t.start) + " 후 " + daysBetween(t.start, t.event) + "일째 진단 (면책기간 끝: " + fmt(addDays(t.start, t.waitDays)) + ")" ] });
          out.exempt = { sub: "가입전진단", reason: "면책기간 " + t.waitDays + "일 중 진단 (" + daysBetween(t.start, t.event) + "일째)" };
        } else {
          const lines = ["진단확정일 " + fmt(t.event) + "은 책임개시일 " + fmt(t.start) + " 이후"];
          if (t.reduceYears && t.event < addMonths(t.start, t.reduceYears * 12)) {
            lines.push("감액기간(" + t.reduceYears + "년) 중 진단 → 가입금액의 " + (t.reduceRate || "약관에서 정한") + "% 지급");
            F.push({ level: "warn", title: "보장개시 이후 진단 · 감액기간 해당", lines });
          } else {
            F.push({ level: "ok", title: "보장개시 이후 진단 (면책·감액기간 아님)", lines });
          }
        }
      }

      // 2) 진단 근거 (진단부적정)
      if (t.diagBasis === "screen" || t.diagBasis === "clinical") {
        F.push({ level: "warn", title: "진단 근거 부족 → 진단 부적정 검토", lines: [
          t.diagBasis === "screen" ? "선별검사(초음파·혈액검사 등)만으로 진단" : "검사 결과 없이 임상 소견만으로 진단",
          "KCD 코딩지침: 의사의 진단 없이 검사결과만으로 코드 부여 불가 / 확정검사 결과 확인 필요",
          "금감원 사례: 객관적 검사 부족 시 제3 의료기관 자문으로 확인 권고" ] });
        if (!out.exempt) out.exempt = { sub: "진단부적정", reason: t.diagBasis === "screen" ? "선별검사만으로 진단" : "임상 소견만으로 진단" };
      }

      // 3) 고지의무: 청약서 질문 기간 안의 이력 중 알리지 않은 것
      const violations = [];
      if (t.apply) {
        t.rows.forEach(r => {
          const k = TL_KINDS[r.kind];
          const from = addMonths(t.apply, -k.months);
          r.inWindow = r.date >= from && r.date <= t.apply;
          if (r.inWindow && !r.told) violations.push(Object.assign({ q: k.q }, r));
        });
        const listed = t.rows.map(r => fmt(r.date) + " " + r.text + " — " + (r.inWindow ? (r.told ? "질문 기간 안 · 알림" : "질문 기간 안 · 알리지 않음") : "질문 기간 밖"));
        if (!violations.length) {
          if (t.rows.length) F.push({ level: "ok", title: "고지의무 위반 없음", lines: listed });
        } else {
          // 해지권 제한 (제16조 제2항)
          const blocks = [];
          if (t.insurerKnew) blocks.push("회사가 계약 당시 알았거나 과실로 몰랐음 (제16조②1)");
          if (t.known && t.today > addMonths(t.known, 1)) blocks.push("회사가 안 날(" + fmt(t.known) + ")부터 1개월 지남 (제16조②2)");
          const freeYears = t.diagContract && isDisease ? 1 : 2;
          if (t.start && t.event && t.event > addMonths(t.start, freeYears * 12)) blocks.push("보장개시 후 " + freeYears + "년간 지급사유 없이 지남 (제16조②2)");
          if (t.today > addMonths(t.apply, 36)) blocks.push("계약일부터 3년 지남 (제16조②3)");
          if (t.agentBlock) blocks.push("설계사가 고지 기회를 안 주거나 방해·부실고지 권유 (제16조②5)");
          const related = violations.some(r => r.related);
          const lines = listed.concat(blocks.length ? ["해지 불가 사유: " + blocks.join(" / ")] : ["해지 기간 안 (안 날부터 1개월 이내 해지 필요" + (t.known ? ": " + fmt(addMonths(t.known, 1)) + "까지" : "") + ")"]);
          if (blocks.length) {
            F.push({ level: "warn", title: "고지의무 위반 있으나 해지 불가 → 보험금 지급·계약 유지", lines });
            out.disclose = { sub: "해지", blocked: true, v: violations[0], blocks };
          } else if (related) {
            lines.push("알리지 않은 사실이 사고에 영향 → 보험금 미지급 가능 (제16조④). 영향을 회사가 입증해야 함 (제16조⑥)");
            F.push({ level: "bad", title: "고지의무 위반 → 해지 + 보험금 면책 검토", lines });
            out.disclose = { sub: "면책", v: violations.find(r => r.related) };
          } else {
            lines.push("알리지 않은 사실과 사고가 관계없음 → 보험금은 지급 (제16조⑥)");
            F.push({ level: "warn", title: "고지의무 위반 → 계약 해지 · 이번 보험금은 지급", lines });
            out.disclose = { sub: "해지", v: violations[0] };
          }
        }
      }

      // 4) 통지의무 (직업 변경)
      if (t.job0 && t.job1 && t.job0 !== t.job1) {
        const changedBefore = !t.jobDate || !t.event || t.jobDate <= t.event;
        if (!changedBefore) {
          F.push({ level: "ok", title: "직업 변경이 사고 뒤 → 이번 사고와 무관", lines: ["직업 바뀐 날 " + fmt(t.jobDate) + " > 사고일 " + fmt(t.event)] });
        } else if (t.notified) {
          F.push({ level: "info", title: "직업 변경을 알림 → 계약내용 변경 (제15조②③)", lines: [
            t.job0 + " → " + t.job1, t.risk === "up" ? "위험 증가: 보험료 인상·정산금 추가납입" : t.risk === "down" ? "위험 감소: 보험료 감액·정산금 환급" : "위험 변화 확인 필요" ] });
          out.notify = { sub: "직업변경 요청" };
        } else if (t.risk === "up") {
          const ratio = t.rate0 && t.rate1 ? Math.min(100, Math.round(t.rate0 / t.rate1 * 1000) / 10) : null;
          const lines = [t.job0 + " → " + t.job1 + (t.jobDate ? " (" + fmt(t.jobDate) + " 변경)" : "") + ", 회사에 알리지 않음"];
          if (t.jobRelated) {
            lines.push(ratio !== null ? "비례보상: " + t.rate0 + " ÷ " + t.rate1 + " = 보험금의 " + ratio + "% 지급 (제15조④⑤)" : "비례보상: 변경 전 ÷ 변경 후 요율 비율로 삭감 (요율 입력 필요)");
            lines.push("고의·중과실이고 뚜렷한 위험 증가면 계약 해지 가능 (제16조①2)");
            F.push({ level: "bad", title: "통지의무 위반 → 보험금 비례 삭감", lines });
          } else {
            lines.push("바뀐 직업과 관계없는 사고 → 원래대로 전액 지급 (제15조④ 단서)");
            F.push({ level: "warn", title: "통지의무 위반 · 이번 사고는 직업과 무관 → 전액 지급", lines });
          }
          out.notify = { sub: "비례보상", ratio, related: t.jobRelated };
        } else {
          F.push({ level: "ok", title: "직업 변경 · 위험 증가 아님", lines: [t.job0 + " → " + t.job1 + " (" + (t.risk === "down" ? "위험 감소" : "위험 변화 확인") + ")"] });
        }
      }

      if (!F.length) F.push({ level: "info", title: "판정할 내용이 없어요", lines: ["청약일·책임개시일·진단확정일과 진료 이력을 넣어 주세요."] });
      return { F, out, violations };
    }

    // ----- 증빙 체크리스트 -----
    function buildChecklist(t, res) {
      const groups = [["공통", ["보험금 청구서", "진단서 (진단명·KCD 코드·진단확정일)", "청약서 사본 · 해당 상품 약관(가입 당시 판)"]]];
      if (res.out.exempt && res.out.exempt.sub === "가입전진단") groups.push(["보장개시·면책기간", ["가입 전 진료기록", "국민건강보험 요양급여내역 (가입 전 5년)", "최초 진단일 확인 소견서"]]);
      if ((res.out.exempt && res.out.exempt.sub === "진단부적정") || t.diagBasis) groups.push(["진단 근거", ["영상판독지 (CT·MRI 등)", "확정검사 결과지 (조직검사 등)", "주치의 소견서", "필요 시 제3 의료기관 의료자문"]]);
      if (res.violations.length || res.out.disclose) groups.push(["고지의무", ["청약서 '계약 전 알릴 의무' 질문 원본", "요양급여내역 · 처방전·투약 내역", "건강검진 결과지 (가입 전 3개월)", "모집경위서 (설계사 고지 안내 확인)", "해지 통지문: 위반사실·중요한 사항인 이유·'반대증거가 있는 경우 이의를 제기할 수 있습니다' 문구 (제16조④)"]]);
      if (res.out.notify) groups.push(["통지의무 (직업)", ["재직증명서 · 근로계약서 (또는 사업자등록증)", "4대보험 자격 이력", "사고경위서 (사고 당시 업무 내용)", "변경 전·후 직업 위험등급 · 요율표"]]);
      return groups;
    }

    function renderTimelineResult(t, res) {
      const fBox = $("tl-findings"); fBox.innerHTML = "";
      res.F.forEach(f => {
        const el = document.createElement("div");
        el.className = "tl-finding " + f.level;
        el.innerHTML = "<h3></h3><ul></ul>";
        el.querySelector("h3").textContent = f.title;
        f.lines.forEach(l => { const li = document.createElement("li"); li.textContent = l; el.querySelector("ul").appendChild(li); });
        fBox.appendChild(el);
      });
      const cBox = $("tl-checklist"); cBox.innerHTML = "";
      buildChecklist(t, res).forEach(([name, items]) => {
        const g = document.createElement("div");
        g.className = "tl-check-group";
        g.innerHTML = "<h3></h3>";
        g.querySelector("h3").textContent = name;
        items.forEach(it => {
          const lab = document.createElement("label");
          lab.innerHTML = '<input type="checkbox"> <span></span>';
          lab.querySelector("span").textContent = it;
          g.appendChild(lab);
        });
        cBox.appendChild(g);
      });
      $("tl-result").hidden = false;
      $("tl-apply-cn").disabled = !(res.out.exempt || res.out.disclose || res.out.notify);
      const worst = res.F.find(f => f.level === "bad") || res.F.find(f => f.level === "warn") || res.F[0];
      setPreview("timeline", [["판정", worst.title, "", true]]);
    }

    $("tl-run").addEventListener("click", () => {
      const t = readTimeline();
      const res = judgeTimeline(t);
      tlLast = { t, res };
      renderTimelineResult(t, res);
      $("tl-result").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // ----- 카드뉴스 자동 채움 -----
    $("tl-apply-cn").addEventListener("click", () => {
      if (!tlLast) return;
      const { t, res } = tlLast;
      const cover = t.cover || "청구 담보";
      let showTab = null;
      if (res.out.exempt) {
        const e = res.out.exempt;
        switchCardNews("exempt", e.sub);
        setCard(0, 0, cover);
        setCard(1, 1, shorten(e.reason, 40));
        saveCardNews(); showTab = showTab || ["exempt", e.sub];
      }
      if (res.out.notify) {
        const n = res.out.notify;
        switchCardNews("notify", n.sub);
        setCard(1, 0, t.job0); setCard(1, 1, t.job1);
        setCard(1, 2, n.sub === "비례보상" ? shorten(cover + " 청구 (" + fmt(t.event) + ")", 24) : "직업 변경 통지 · 계약 변경");
        if (n.sub === "비례보상") {
          if (!n.related) { setCard(2, 0, "보험금 전액 지급"); setCard(2, 1, "바뀐 직업과 관계없는 사고"); setCard(2, 2, "(제15조④ 단서)"); }
          else if (n.ratio !== null) setCard(2, 2, t.rate0 + " ÷ " + t.rate1 + " → 보험금 " + n.ratio + "%");
        }
        saveCardNews(); showTab = ["notify", n.sub];
      }
      if (res.out.disclose) {
        const d = res.out.disclose;
        switchCardNews("disclose", d.sub);
        setCard(1, 0, d.v.q);
        setCard(1, 1, shorten(fmt(d.v.date) + " " + d.v.text, 24));
        setCard(1, 2, cover);
        if (d.blocked) {
          setCard(2, 0, "보험금 지급 · 계약 유지");
          setCard(2, 1, shorten("해지 불가: " + d.blocks[0], 24));
          setCard(2, 2, "고지의무 위반 해지 제한 (제16조②)");
        } else if (d.sub === "면책") {
          setCard(2, 0, shorten(cover + " 지급 불가 · 계약 해지", 24));
          setCard(2, 1, shorten(d.v.text + "이(가) 사고에 영향", 24));
        } else {
          setCard(2, 0, shorten(cover + "는 지급 · 계약은 해지", 24));
        }
        saveCardNews(); showTab = ["disclose", d.sub];
      }
      if (showTab) switchCardNews(showTab[0], showTab[1]);
      setPreview("cardnews", [["양식", CN_SETS[cnTab].label + " · " + cnSub], ["자동 반영", "타임라인 판정"]]);
      Jangsoni.navigate("cardnews");
    });
