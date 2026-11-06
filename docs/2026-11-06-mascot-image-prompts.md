# 2026-11-06 장손이 잡기 이미지 생성 기록

내장 image_gen 도구로 생성·편집했습니다. 최종 두 이미지 모두 실제 투명 PNG이며, 각 파일은 같은 크기의 2개 프레임을 나란히 담습니다. 사용자가 추가로 요청한 감은 눈·내려달라는 표정을 최종 자산에 반영했습니다.

최종 저장 위치:
- `assets/mascot/packs/guide/grab.png`
- `assets/mascot/packs/original/grab.png`

기존 `companion.webp`를 각각의 캐릭터 참조로 사용했고, 기본 시트 생성 후 표정만 편집했습니다. 기존 시작화면·걷기·기본 안내 이미지는 교체하지 않았습니다.

## Guide base sheet

```text
Use case: identity-preserve. Asset type: transparent 2.5D animation sprite sheet for a tiny website mascot. Reference image: the attached four-pose GUIDE otter sheet is the exact character identity and rendering style; do not redesign. Create one wide 2048x1024 transparent PNG containing exactly TWO equal 1024x1024 cells, no gutters, no labels. Each cell shows the SAME full-body light blue plush otter with large silver round glasses, round dark eyes, white navy-trimmed buttoned jacket, small blue emblem, yellow folder and magnifying glass, fluffy tail. Preserve face, proportions, fur color, clothes and existing slight RIGHT-facing angle as reference (website mirrors it later). Pose: playfully dangling as if gently picked up at the crown of its head by an invisible cursor; no hand, no string, no grabber drawn. A cute surprised but happy expression, body hanging down, arms waving while still holding its props, little feet off the ground. Frame 1 left foot kicks outward while right foot curls in; frame 2 right foot kicks outward while left curls in, arms change a little. Lock head position, size and crown anchor exactly across both cells: center x=512 within each cell, crown y=140, head center around y=350, feet within y=920. Same scale, camera, lighting and silhouette alignment in both. No motion lines, stars, ground shadow, backdrop, text, extra characters or extra body parts. Truly transparent background, clean alpha edges, all limbs and tail fully inside each cell. High quality soft plush 3D render matching the reference.
```

## Original base sheet

```text
Use case: identity-preserve. Asset type: transparent 2.5D animation sprite sheet for a tiny website mascot. Reference image: the attached four-pose ORIGINAL otter sheet is the exact identity and rendering style; do not redesign or turn into the chibi guide character. Create one wide 2048x1024 transparent PNG with exactly TWO equal 1024x1024 cells, no gutters, no labels. SAME full-body soft pale turquoise-blue otter, silver circular glasses, small blue nose, cream muzzle, original round face, long whiskers, white coat with navy collar and stripe pockets, navy chest patch reading AI CLAIM in normal readable direction, checklist clipboard and magnifying glass. Preserve proportions, face, fur, clothes, props and slightly LEFT-facing original angle. Pose: playfully dangling as if gently picked up at the crown by an invisible cursor, body hanging below its head, cute surprised happy face, arms wavering with its props, little feet off the ground. No hand, string or grabber drawn. Frame 1 left foot kicks outward/right curls in; frame 2 right foot kicks outward/left curls in, subtly alternating arms. Lock head size and position across cells: center x=512 in each cell, crown y=140, head center around y=350, feet within y=920. Same scale, camera and lighting. No motion lines, stars, ground shadow, background, extra characters or extra limbs. Real transparent alpha with clean edges, full body, limbs and tail entirely inside each tile. High quality soft 3D render matching the exact original reference.
```

## Guide closed-eye edit

```text
Use case: identity-preserve. Edit ONLY the facial expression of BOTH otters in this existing two-frame transparent GUIDE sprite sheet. Keep exactly the same character identity, camera, framing, sizes, head positions, two-cell layout, coat emblem, glasses, fur, tail, yellow folder, magnifying glass, alternating kicking feet and waving arms. Both frames should have eyes squeezed completely SHUT: natural cute curved eyelids under the glasses, not hollow eye sockets, no empty holes or black voids. Replace the cheerful open mouth with a small cute worried pout or pleading tiny wavy mouth, conveying a playful 'please put me down!' while dangling and struggling, endearing and humorous, not pain or distress. No tears, words, motion lines, new props, cursor or hands. Preserve the real transparent background and clean alpha. Preserve all original pose registration and do not change cell boundaries. Return the edited TWO-frame sheet, same aspect ratio.
```

## Original closed-eye edit

```text
Use case: identity-preserve. Edit ONLY the facial expression of BOTH otters in this existing ORIGINAL mascot two-frame transparent sprite sheet. Preserve the exact original face identity, blue nose, silver round glasses, proportions, soft turquoise fur, white/navy coat with readable AI CLAIM patch, checklist clipboard, magnifier, tail, alternating kicking feet, positions, lighting, two-cell layout and camera. Both frames need eyes tightly CLOSED as natural cute curved shut eyelids behind the glasses (no hollow eyes, no black voids, no blank eye sockets). Change the happy open mouth to a small pleading, gently trembling pout, conveying a playful 'please put me down!' while the character dangles and flails. The mood is cute mildly indignant, never hurt, distressed or scary. No tears, words, motion marks, extra objects, cursor or hands. Keep the same cell framing and registered crown/head anchors in both frames. Preserve true transparency and clean alpha. Return the same TWO-frame transparent sheet and aspect ratio.
```
