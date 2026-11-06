# Chrome 휴대전화 모드에서 카드 안 끌기 복구

## 사용자 확정 사항

사용자가 확인한 환경은 Chrome 개발자도구의 휴대전화 모드에서 마우스로 끌기다. 상단 오른쪽 장손이·왼쪽 말풍선·아래 흰색 아코디언 카드는 유지하고, 카드 안에서도 끌어 다음 카드로 전환하도록 수정 재개 승인을 받았다. 옆 안내선 시안이나 새로운 캐릭터 동작은 적용하지 않는다.

## 수정 전 재현에서 확인한 사실

`scripts/verify-mobile-devtools.mjs`에서 별도 로컬 HTTP 미리보기를 열고 Chrome의 `Emulation.setEmitTouchEventsForMouse`와 `Input.emulateTouchFromMouseEvent`를 사용했다. 설정과 입력 명령의 정의는 [Chrome 프로토콜](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/Emulation.pdl), [Chromium 입력 명령 정의](https://chromium.googlesource.com/chromium/src/%2B/2f41a8e7fb08c23517c85c29e498b803eb53d36e/third_party/blink/public/devtools_protocol/browser_protocol.pdl)를 참고했다. 일반 마우스 입력이나 직접 생성한 DOM 이벤트로 대체하지 않았다.

현대해상 스타일의 390×844에서 세 번째 카드 본문을 3px씩 총 90px 끌었다. `pointerType: touch`와 Touch Events가 함께 들어왔고, 처음 취소 가능한 `touchmove` 이후에는 취소 불가능한 `touchmove`가 이어졌다. 수정 전 활성 카드 인덱스는 2, 스크롤 좌표는 4383으로 그대로 남았다. 동일 재현은 수정 후 카드 인덱스 3, 좌표 4932로 도착했다.

수정 전 `onMobilePointerDown()`은 터치형 포인터를 제외했다. `touchmove` 처리도 `event.cancelable`이 false이면 방향 판정 전에 반환했다. 처음 들어온 움직임이 18px 기준보다 작은 상태에서 이후 터치가 취소 불가능해지면 두 입력 경로 모두 목적지를 기록하지 못했다. 기존 `test:mobile-pointer`의 일반 마우스 검사와 `test:mobile-mascot`의 직접 터치 입력 검사는 이 변환 경로를 재현하지 않았다.

## 변경 범위

- `src/ui/journey.js`의 카드 보드 안에서는 일반 마우스와 터치형 포인터가 같은 끌기 처리를 사용한다. 보드 밖의 기존 터치 처리는 섹션 진입·종료 전환에 유지한다.
- 포인터로 시작한 제스처를 뒤따르는 `touchstart`가 다시 초기화하지 않게 한다. 추가 손가락 입력은 진행 중 끌기를 취소한다. 모션 감소 설정의 터치는 기존 일반 스크롤을 유지한다.
- 배치·색·흰색 카드·이미지·걷기 순서·900ms 이동 시간·업무 코드·입력 필드·내장 데이터는 이번 수정 대상에 포함하지 않는다. 빌드한 `index.html`에 입력 처리 변경을 반영한다.
- `scripts/test-preview.mjs`는 빌드 HTML과 업무 대조용 main HTML만 명시된 경로로 제공한다. 임시 포트의 루프백 HTTP 서버를 사용하며 디렉터리나 임의 파일을 공개하지 않는다. 기존 회귀 검사도 이 별도 미리보기에서 실행한다. 사용자 브라우저의 기존 로컬 파일 탭은 읽거나 조작하지 않는다.

## 검증 범위

`test:mobile-devtools`는 390×844·320×568·293×664에서 Chrome의 마우스→터치 변환을 켠다. 세 크기에서 본문·기능 버튼 끌기 왕복, 초기 작은 이동과 이후 취소 불가능한 터치 입력, 실제 포인터 캡처를 확인한다. 390px에서는 제목·태그 끌기, 7개 카드 왕복, 작은 흔들림·수평 이동·취소/복구, 이동 중 추가 끌기 차단, 목록 내부 넘침, 짧은 제목 탭, 기능 버튼 탭과 뒤로가기도 확인한다.

기존 `test:scroll`, `test:mobile-mascot`, `test:mobile-pointer`, `test:companion`, `test:regression`도 유지한다. 자동화된 Chrome 검사이며 실제 휴대전화에서의 Safari·Chrome 실기기 검사는 포함하지 않는다. 따라서 이번 실패를 개발자도구에만 한정된 문제로 단정하지 않는다.

## 실행 결과

| 브랜치 / 검사한 구현 커밋 | DevTools 변환 | 일반 마우스 | 직접 터치 입력·캐릭터 | 섹션 스크롤 | 안내·채팅·잡기 | main 업무 대조 |
|---|---|---|---|---|---|---|
| `v2-hyundai-style` / `cb5d70f` | 통과 | 통과 | 통과 | 통과 | 통과 | 통과 |
| `v2-mascot-guide` / `6f7e697` | 통과 | 통과 | 통과 | 통과 | 통과 | 통과 |
| `v2-mascot-original` / `4f2d5cc` | 통과 | 통과 | 통과 | 통과 | 통과 | 통과 |

세 브랜치에서 6개 검사 명령을 각각 실행했다. 업무 대조는 원본 함수 80개·연결 36개·두 내장 데이터 묶음과 입력/편집 필드 106개를 포함했다. 타임라인 6개 시나리오, 판례 8개 상태, 약관 3개 분류, KCD 검색 4종, 분쟁조정 20개 상태, 카드뉴스 7개 양식, 전체/개별 1080px PNG 저장, 편집 저장·초기화와 방문 기록 검사도 통과했다. 외부 응답은 동일한 고정 자료로 대체한 검사이며 실제 외부 서비스의 현재 응답 검사는 아니다.

가이드·오리지널의 `src`·`scripts`·`package.json`·README·docs를 대조했을 때 차이는 `src/mascot-assets.json`의 팩 경로뿐이다. 이번 작업 전 각 브랜치 커밋 대비 `src/analysis.js`·`src/data`·`src/styles`·`src/page.html`·`assets` 변경은 없다. `main`과 `origin/main`은 `549f2e1837d01f392cda7d40959d16d137667e32`다. 실행 결과 기록과 함께 수정한 테스트 출력 문구는 각 크기에서 실제 검사한 영역을 구분하기 위한 것이며, 판정 조건은 바꾸지 않았다.
