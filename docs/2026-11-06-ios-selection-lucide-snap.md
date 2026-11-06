# 장손이 선택 방지·Lucide 통일·소개 섹션 전환

## 사용자 확정 사항

- 둘러보기를 펼쳤을 때 큰 섹션은 첫 화면, 자료 소개, 사건 정보 안내, 7개 기능 둘러보기, 결과 예시, 사건 정보 입력의 6개다. 7개 기능 카드는 내부 단계이고 푸터는 별도다.
- 사용자는 아이폰 Chrome에서 장손이를 길게 눌러 끌 때 옆 도움말 문구까지 파란색으로 선택됐다고 보고했다.
- 아이콘 후보 중 Lucide를 선택했으며, 이후 UI 아이콘도 이 세트로 통일하도록 요청했다.
- 사용자가 전환 지연을 지적한 곳은 **데스크톱**의 자료 소개 → 사건 정보 안내다. 데스크톱에서는 한 번의 휠로 다음 섹션 맨 위로 전환한다.
- 모바일은 기존 소개 카드의 크기를 유지한다. 첫 스크롤에 소개 섹션 맨 아래를 읽고, 다음 스크롤에 사건 정보 안내 맨 위로 전환한다.

## 변경과 근거

`src/styles/companion.css`는 장손이 버튼·그 하위 요소·모바일 도움말 띠에 `-webkit-user-select:none`, `user-select:none`, `-webkit-touch-callout:none`을 적용한다. 변경 전 도움말 띠의 선택 값은 Chrome에서 `auto`, WebKit에서 `text`였다. `src/ui/companion.js`는 장손이를 누를 때 기존 선택을 해제하고, 버튼의 `touchstart`에서 기본 동작을 취소한다. 적용 범위는 장손이 조작부이며 업무 입력과 일반 본문 선택은 유지한다. 참고: [MDN user-select](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/user-select), [Apple 터치 이벤트 안내](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html).

`src/ui/journey.js`의 `onJourneyWheel()`은 긴 섹션 읽기 예외에서 자료 소개만 제외한다. 다른 섹션의 긴 내용 읽기는 유지한다. `mobileDestination()`은 소개 맨 위·소개 맨 아래·사건 정보 안내 맨 위를 구분한다. 소개 맨 위에서 역방향으로 첫 화면에 돌아갈 수도 있게 했다. 모바일 폭에서 마우스로 소개를 끌 때에는 글자 선택과 브라우저의 텍스트 끌기를 취소한다. WebKit 추가 재현에서 역방향 제스처로 선택된 글자가 남은 뒤, 다음 드래그가 `pointerup` 대신 `dragstart`/`dragend`로 끝나는 것을 확인해 이 경로를 보완했다.

`src/ui/icons.js`가 Lucide 1.70.0에서 필요한 아이콘만 등록한다. `src/page.html`의 기존 기호와 사용자 안내의 그림 아이콘을 이 목록으로 연결했다. 업무 스크립트가 동적으로 만드는 카드뉴스 체크·링크와 타임라인 삭제 버튼도 표시 단계에서 Lucide로 바꾼다. 사용자가 편집한 내용·입력값·원본 데이터는 치환 대상에 포함하지 않는다. 아이콘 코드는 HTML 안에 포함하며, 배포 라이선스 전체도 HTML 주석에 넣는다. 참고: [Lucide 공식 JavaScript 안내](https://lucide.dev/guide/lucide/getting-started).

## 검사 방법과 한계

`test:mobile-polish`는 Chrome과 WebKit에서 1366×600 데스크톱과 390×844·320×568 모바일 배치를 검사한다. 큰 섹션 6개·Lucide 연결·한 번의 휠 전환·소개의 두 단계 이동과 마지막 카드 노출·역방향 복귀·다시 소개에 진입하기·도움말 띠의 선택 방지·일반 제목의 선택·장손이 탭·직접 입력한 `🔗` 문구 보존을 확인한다.

Chrome 모바일에서는 실제 브라우저 Touch Events로 쓸기와 500ms 길게 잡기를 검사한다. WebKit 모바일에서는 네이티브 마우스 드래그로 모바일 스냅 위치를 검사하고, 실제 브라우저 터치 탭으로 `touchstart` 취소와 채팅 열기를 확인한다. 실제 아이폰의 선택 핸들·확대경·길게 누르기 메뉴는 이 검사에 포함하지 않는다.

`test:regression`은 기존 main과 같은 업무 판정·필드·링크를 비교한다. 요청된 장식 변경에 맞춰 카드뉴스의 `.cn-check`와 `.cn-link a` 앞의 장식 기호만 텍스트 비교에서 분리했다. 입력 스키마와 업무 결과·링크 주소 비교는 유지하며, `src/analysis.js`와 `src/data`는 변경하지 않는다.

현대해상 브랜치에서 `test:scroll`, `test:regression`, `test:companion`, `test:mobile-mascot`, `test:mobile-pointer`, `test:mobile-devtools`, `test:mobile-polish`가 통과했다. 업무 대조 결과는 원본 함수 80개·연결 36개·내장 데이터 2종, 입력/편집 106개, 타임라인 6개 시나리오·판례 8개 상태·약관 3개 분류·KCD 검색 4종·분쟁조정 20개 상태·카드뉴스 7개 양식이 일치했다. 전체/개별 1080px PNG 저장, 편집 저장·초기화, 방문 기록 검사도 통과했다.
