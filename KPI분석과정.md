soundscape-music-agent의 핵심 알고리즘: **[상황 인식 → 감정 추론 → 음악 큐레이션]**

딥링크(Deep Link)를 통해 외부 앱(Spotify)으로 이탈하는 서비스 구조상, 앱 내에서 직접적인 청취 행동을 트래킹하기 어려운 한계가 존재함.

### 1. KPI정의

- Context-Sentiment Accuracy
- Persona-Genre Accuracy
- Agent Latency
- Deep Link Conversion
- Satisfaction RMSE

### 2. KPI측정

2.1 Context-Sentiment Accuracy (상황, 감정 정확도 ): LLM이 분석한 Context 과 유저 설정 키워드의 정확도 계산

2.2 Persona-Genre Accuracy: LLM이 도출한 장르와 유저 선호 장르와의 키워드 정확도 계산

- **키워드 매칭:**
    1. 사용자가 입력한 location과 goal 키워드가 에이전트가 생성한 recommendation_reason 문장 안에 물리적으로 포함되어 있는지 확인
    2. 사용자가 입력한 user_persona_preferred_genres가 에이전트가 생성한 user_persona_taste_summary 문장 안에 물리적으로 포함되어 있는지 확인

[KPI 1] Context-Sentiment Accuracy: 81.17%
[KPI 2] Persona-Genre Accuracy: 100.00%

```markdown
- 높은 반영률: 페르소나 정확도가 **100%**인 것으로 보아 에이전트가 유저의 선호 장르를 요약 문장에 완벽히 반영하고 있으며, 상황 정확도 역시 **81%**로 높은 수준을 유지하여 유저의 입력 맥락(장소, 목표)을 대부분 놓치지 않고 추천 사유에 녹여내고 있습니다.

- 개선 포인트: 상황 정확도에서 발생한 약 **19%**의 미달분은 에이전트가 키워드를 직접 언급하는 대신 '편안한', '활기찬' 등 유의어로 대체한 경우임, 향후에는 키워드 매칭 외에 의미적 유사도(Semantic Similarity)를 함께 고려한 정교화 작업이 필요해 보입니다.
```

**Persona-Genre Accuracy 100% — 측정 한계 (해석 주의)**

- 이 100%는 "완벽한 반영"을 뜻하지 않는다. 측정 방식이 사용자가 입력한 선호 장르명(`preferred_genres`)이 LLM이 생성한 페르소나 요약(`taste_summary`)에 **한 번이라도 문자열로 등장하는지** 확인하는 단순 키워드 포함 여부이기 때문에, 장르명이 텍스트에 한 번만 들어가도 1점으로 집계되는 관대한 기준이다.
- 따라서 이 지표가 검증하는 것은 추천 품질이 아니라 **"LLM이 사용자 취향 정보를 누락 없이 페르소나에 담고 있는가(정보 누락 여부)"** 에 한정된다.
- 장르가 맥락에 맞게 반영됐는지(과반영·부적합 여부)나 의미적 정확도는 측정하지 못한다. 향후 의미적 유사도(Semantic Similarity)나 곡 단위 적합성 평가로 보완이 필요하다.

2.3 Agent Latency (에이전트 지연 시간) :소리 분석 시작부터 음악 추천까지 걸리는 시간 (latency_ms칼럼사용).

[지연 시간 통계 요약]

- 평균 지연 시간: 7.62초
- 중앙값: 6.34초
- 최장 지연 시간: 18.97초
- 최단 지연 시간: 1.01초

날짜가 경과함에 따라(최근으로 올수록) 에이전트의 응답 속도가 개선되고 있는지 확인하기 위해, 시계열 추세 분석(Time-series Trend Analysis)

날짜와 지연 시간 간의 상관계수: -0.2231
(음수일 경우 최근으로 올수록 지연 시간이 줄어들고 있음을 의미합니다.)

```markdown
- 성능 최적화 추세 확인: 전체 평균 지연 시간은 7.62초(중앙값 6.34초)로 안정적인 수준이며, 날짜와 지연 시간 간의 상관계수가 -0.2231로 나타나 최근으로 올수록 응답 속도가 점진적으로 개선되는 긍정적인 기술적 지표를 보여주고 있습니다.

- 업데이트 영향 및 회복력: 7~13일 사이 개인화 추천(아티스트/장르 취향) 로직 도입으로 인해 일시적인 연산 부하와 지연 시간 상승이 발생했으나, 이후 지속적인 성능 최적화를 통해 다시 응답 속도를 하향 안정화시킨 에이전트의 회복 탄력성을 확인할 수 있습니다.
```

2.4 Deep Link Conversion (DLC): 

2.4.1 추천 결과를 본 사용자 중 실제로 'Spotify에서 듣기' 버튼을 누른 사용자의 비율 

전체 Deep Link Conversion (DLC): 85.15%

2.4.2 상황별(Location x Goal) 전환율: 추천 엔진이 특정 장소나 목적에서 약점을 보이는지 확인, `playlists.xlsx`의 `id`(PK)와 `spotify_link_click.xlsx`의 `playlist_id`(FK)를 기준으로 Left Join을 수행

[개선 필요] 전환율이 가장 낮은 상황 TOP 5:
location  goal
카페        분노       0.0
도서관       위로      25.0
코워킹       미설정     40.0
도서관       휴식      50.0
카페        위로      50.0

2.4.3 특정 상황(Location x Goal)별로 전환율(DLC)과 지연 시간(Latency)의 상관관계를 분석 :  전환율이 낮은 이유가 응답이 늦어서인지 추천내용이 별로인지 구분 가능

```markdown
- 높은 전반적 수용도: 전체 DLC가 **85.15%**에 달하는 것은 에이전트의 추천이 대다수 유저의 니즈를 만족시키고 있음을 보여주며, 특히 특정 장소와 목표가 결합된 상황에서 강력한 전환 동기를 제공하고 있습니다.

- 부정적 감정 및 특정 공간 로직의 한계: '카페-분노(0%)'나 '도서관-위로(25%)'와 같이 장소의 성격과 유저의 감정 상태가 상충하거나 복잡한 맥락이 필요한 경우 전환율이 급격히 떨어지는 양상을 보입니다.

- 맥락 최적화 필요성: 특히 '카페'와 '도서관'처럼 공공적인 공간에서 위로나 분노 해소와 같은 개인적인 감정 케어 요청이 들어올 때, 에이전트가 제안하는 음악 스타일이나 추천 사유가 공간의 분위기와 어긋나지 않는지 로직 재검토가 필요합니다.
```

2.5 Satisfaction RMSE : (유저 부여 별점 - 시스템 예측 만족도)의 오차 계산

- 시스템 예측 만족도 $Predicted = \text{Max Score} - (\text{Penalty Weight} \times \text{Latency (sec)})$
- Max Score: 시스템이 지연 시간 없이 즉시 응답했을 때 기대하는 최대 점수 (예: 4.0).
- Penalty Weight: 1초 지연될 때마다 감점할 점수 (예: 0.15).

복합 키 매칭 결과: 26개의 유효 데이터가 매칭되었습니다.
Satisfaction RMSE: 1.1353

```markdown
- 예측 모델의 오차 존재: RMSE가 약 1.14로 나타난 것은 시스템이 지연 시간(Latency)만으로 예측한 만족도와 유저의 실제 별점 사이에 평균 1점 이상의 차이가 있음을 의미하며, 이는 유저가 속도뿐만 아니라 추천된 곡의 품질이나 분위기 등 콘텐츠 자체를 중요하게 평가하고 있음을 시사합니다.

- 보정 방향성 제시: 현재 시스템이 지연 시간 패널티를 통해 다소 보수적이거나 일률적인 예측을 하고 있을 가능성이 높으므로, 향후 RMSE를 낮추기 위해서는 앞서 계산한 '상황 정확도(Context Accuracy)'와 같은 콘텐츠 일치 지표를 예측 수식에 결합하여 시스템의 자기 객관화 능력을 개선해야 합니다.
```

- Positive Feedback Rate: will_reuse 응답비율
- Churn Rate (고객 이탈률): 서비스를 특정기간이상 이용하지 않는 비율, 5일이상
- Re-entry Rate: 재사용비율, 당일 재방문율을 통해 만족도 간접 추정.
- App Stay Time: spotify_link_click.xlsx의 minutes_from_creation을 통해 유저가 추천을 받고 얼마나 빨리 행동(클릭)했는지 분포를 확인

**Spotify API**를 사용하면 URL의 ID(예: `713inr1wX...`)를 통해 트랙 정보(장르, 아티스트, 인기도 등)를 가져올 수 있습니다. 이 데이터를 추가로 준비해 주시면 `Seed Track Match`와 `Discovery Score` 측정이 가능

- Seed Track Match: 사용자가 사전에 설정한 '선호 장르/아티스트'가 추천된 플레이리스트 내에 포함된 비율(%)로 측정.
- Discovery Score: 추천된 곡들의 'Spotify Popularity Index'(인기도 지수)가 낮은 곡(비주류 곡)이 포함된 비중을 계산하여 참신성 간접 측정?
- 다양성 (Diversity) : 추천 결과가 얼마나 다양한지 측정, 트랙별 장르를 알 수 없기 때문에 국가 다양성으로 측정

---

### **playlists.xlsx (전체 목록,모든 세션)**

> 에이전트가 추천을 완료하여 화면에 보여준 시점에 기록
> 
- **id**: 서비스 내부 플레이리스트 고유 ID (PK)
- **user_id**: 사용자 식별자
- **decibel / goal / location**: 입력받은 상황 데이터
- **spotify_playlist_id**: 스포티파이 연동 ID
- **playlist_url**
- **recommendation_reason**: 에이전트의 추천 사유
- **search_query**: 에이전트가 사용한 검색어 리스트
- **user_persona**: 분석된 유저 페르소나 정보
- **latency_ms**: 에이전트 전체 응답 시간
- **tool_call_success**: 도구 호출 성공 여부
- **inference_count**: 에이전트 추론/재평가 횟수
- **created_at**: 플레이리스트 생성 일시
- **deeplink**: 딥링크 버튼 클릭 여부
- **retry**: 다시 추천 버튼 클릭 여부

```json
{
  "id": "1",
  "user_id": "1",
  "decibel": "loud",
  "goal": "focus",
  "location": "cafe",
  "spotify_playlist_id": "37i9dQZF1DXcBWIGoYBMwo",
  "playlist_url": 
  "recommendation_reason": "차분한 케이팝 중심으로 편안한 카페 분위기 음악으로 준비했습니다.",
  "search_query": [
    "카페 음악",
    "Cafe Music",
    "カフェ 音楽",
    "차분한 케이팝",
    "Chill K-pop",
    "[선호 아티스트] ILLIT",
    "[선호 아티스트] aespa",
    "[선호 아티스트] NewJeans",
    "[선호 아티스트] NewJeans",
    "[선호 아티스트] NewJeans"
  ],
  "user_persona": {
    "preferred_genres": [
      "k-pop"
    ],
    "taste_summary": "최신 트렌드의 감각적 K-pop 메인스트림 음악을 즐기는 대중적 청취자."
  },
  "latency_ms": 1250,
  "tool_call_success": {
    "spotify_api": true,
  },
  "inference_count": 2,
  "created_at": "2026-01-10T14:30:00Z"
  "deeplink" : true
  "retry" : true
}
```

### **spotify_link_click.xlsx (딥링크 클릭 목록)**

> 사용자가 딥링크 버튼을 클릭한 시점에 기록
> 
- **id**: 로그 고유 ID
- **playlist_id**: playlists.xlsx**의 id와 매칭되는 외래키 (FK)**
- **user_id**: 사용자 식별자 (18명)
- **minutes_from_creation**: 플레이리스트 생성되고 난 후 딥링크버튼 누를때까지의 시간 (밀리초)
- **is_retry_clicked**: '다시 추천받기' 버튼 클릭 여부 (T/F)
- **clicked_at**: 딥링크 버튼 클릭 일시

```json
{
  "id": "1",
  "playlist_id": "1",
  "user_id": "1",
  "minutes_from_creation": 11788,
  "is_retry_clicked": false,
  "clicked_at": "2026-01-10T14:32:30Z"
}
```

### review.xlsx (팝업로그)

- **id** : 로그 고유 ID
- **playlist_id**: playlists.xlsx**의 id와 매칭되는 외래키 (FK)**
- **user_id**
- **rating(0-4)**
- **will_reuse(T/F)**
- **dislike_reason(문장형객관식)**
- **lyrics_preference(on/off)**
- **preferred_mood(energetic/calm)**
- **feedback(주관)**
- **created_at**: 피드백 응답 일시

```json
{
  "id": "1",
  "user_id": "1",
  "rating": 4,
  "will_reuse": true,
  "dislike_reason": "곡 자체가 제 취향이 아니에요",
  "lyrics_preference": "lyrics_on",
  "preferred_mood": "calm",
  "feedback": "전반적으로 만족스럽지만, 조금 더 최신 곡 위주로 추천해주면 좋겠어요.",
  "created_at": "2026-01-01 22:21:00.319862"
}
```

decibel : quiet, loud, moderate

goal: 활력, 안정, 집중, 수면, 분노, 위로, 휴식, 미설정

location: 도서관, 집/실내, 이동중, 카페, 헬스장, 코워킹, 공원

### 3. 기본 통계 분석

KPI자동화를 구축하기 위한 데이터 부족으로 현재 가진  

`playlists-2026.1.4 .xlsx,` `spotify_link_clicks_1_16.xlsx,` `reviews_1_16.xlsx` 데이터를 사용해 기본 피드백 분석

- 사용자 경향성 분석
    - **서비스 이용 행태 분석**: `playlists-*.xlsx`,`spotify_link_clicks_1_16.xlsx`에서 에이전트가 가장 많이 생성한 `location, goal,decibel` 비중을 구함
        - **의미:** "우리 서비스는 주로 '코워킹' 장소에서 '활력'을 얻기 위해 가장 많이 사용됨." (서비스의 주 타겟 상황 정의) -
        - 
        
        
    - **추천 결과의 세부 만족도 분석**: `review.xlsx`에서 사용자들이 설정한 `preferred_mood`와 `lyrics_preference`의 비중을 분석합니다.
        - **의미:** "사용자들은 전반적으로 가사가 있는 곡(`lyrics_on`)을 선호하며, '에너제틱'한 분위기를 더 기대하는 경향이 있음."
- 사용자 만족도 분석
    - **정량적 지표:**
        - `rating`의 평균값(평점 평균)과 `will_reuse`(재사용 의사 비율 )
        - `will_reuse` 별 사용자들의 평균 `rating`
    - **상관관계 분석:** 가사선호, 선호무드별 평균 평점
- 사용자 유형별 만족도 그룹화
    - **그룹 A (충성파)**: 평점 3.0이상 + 재사용 의사 True
    - **그룹 B (이탈 위험)**: 평점 2.0 이하 + 재사용 의사 False
    - **상황 패턴 분석**: 충성파들의 주요 시나리오
        - *결론 예시:* "우리 서비스는 '카페'에서 '집중'하고자 하는 유저들에게 압도적인 만족도를 제공하고 있음."
    - **이탈위험 유저들의 페인 포인트(Pain Point)심층 분석**: 
    이 유저의 `preferred_mood`와 `lyrics_preference`를 확인하고, `dislike_reason`이나 `feedback`을 대조
        - **가설 설정**: "이 유저는 차분한 무드를 원했으나 가사가 있는 곡이 나와서 집중을 방해받았다고 느낌. 따라서 'Focus' 목표 시 가사 없는 곡의 비중을 높이는 로직이 필요함."
- **Frequency (빈도분석)**: 사용자가 특정 기간 동안 얼마나 자주 플레이리스트 생성을 요청했는지
    - *데이터 활용*: `user_id`별 행 개수 카운트.

+

데이터를 완전히 갖춘 후에 가능한 통계 분석

- `user_id`별 시계열 분석: 플레이리스트 생성, 링크 클릭, 리뷰 작성을 하나의 타임라인으로 합쳐서 분석
- ~~RFM~~
    - **Recency (최근성)**: 사용자가 마지막으로 플레이리스트를 생성하거나 앱을 방문한 시점이 언제인가?
        - *데이터 활용*: `playlists-*.xlsx`의 `created_at` 또는 `reviews_1_16.xlsx`의 `created_at` 최신 날짜.
    - **Frequency (빈도)**: 사용자가 특정 기간 동안 얼마나 자주 플레이리스트 생성을 요청했는가?
        - *데이터 활용*: `user_id`별 행 개수 카운트.
    - **Monetary (수익성 → 음악에서는 '몰입도')**: 사용자가 서비스에 얼마나 만족하며 깊게 이용했는가?
        - *데이터 활용*: 평균 `rating` 점수 또는 `will_reuse` 여부.
    - "R과 F는 높지만 M(평점)이 낮은 유저는 '헤비 유저이지만 현재 추천 품질에 불만이 있는 상태'로 정의하여 집중 관리가 필요함.”

### 4. 사용자 로그 데이터 통계분석

`playlists_final.xlsx (전체 목록,모든 세션)`

`spotify_link_click.xlsx (딥링크 클릭 목록)`

`review.xlsx (팝업로그)`  

[통계분석]

1. 사용자 경향성 분석
- playlists_final.xlsx에서 에이전트가 가장 많이 생성한 location, goal,decibel 비중을 구함 -> bar차트


- location x goal 비중 → 히트맵

- review.xlsx에서 preferred_mood와 lyrics_preference의 비중을 분석함. -> pie차트


1. 사용자 만족도 분석
- rating의 평균값(평점 평균)과 will_reuse(재사용 의사 비율 )
    
    
- will_reuse 별 사용자들의 평균 rating
    
    
- 가사선호, 선호무드별 평균 평점


1. 사용자 유형별 그룹화

사용자 유형을 **충성파(Loyal)**와 **이탈 위험파(Churn Risk)**로 나누어 이들의 행동 패턴과 선호도를 심층 비교

만족도가 높은 유저들이 주로 어떤 상황에서 서비스를 이용하는지 파악하고, 만족하지 못한 유저들의 페르소나를 직접 확인함으로써 서비스 개선 포인트를 찾는 데 목적

- 그룹 A (충성파): 평점 3.0이상 + 재사용 의사 True
- 그룹 B (이탈 위험): 평점 2.0 이하 + 재사용 의사 False

<aside>
🚩

[1. 그룹별 유저 ID 확인 ]

- 그룹 B (이탈위험) 유저 ID: [np.int64(11), np.int64(14)] (한 번이라도 부정 응답을 한 유저)
- 그룹 A (충성파) 유저 ID: [np.int64(2), np.int64(3), np.int64(4), np.int64(5), np.int64(6), np.int64(7), np.int64(8), np.int64(9), np.int64(10), np.int64(12), np.int64(13), np.int64(15), np.int64(16), np.int64(17), np.int64(18)] (부정 응답 없이 긍정 응답만 한 유저)

---

</aside>

- 충성파들의 주요 시나리오 분석 (충성파들의 주된 입력값들이 뭔지 분석)


- 충성파들의 preferred_mood와 lyrics_preference 분석


- 이탈위험파 들의 주요 시나리오 분석 (이탈위험파들의 주된 입력값들이 뭔지 분석)
- 이탈위험파들의 preferred_mood와 lyrics_preference 분석


- 이탈위험파들은 수가 많지 않으므로 칼럼전체를 직접 출력해서 확인
    
    

1. 빈도분석
- 사용자가 특정 기간 동안 얼마나 자주 플레이리스트 생성을 요청했는지 분석 -> playlists_final.xlsx의 user_id별 행 개수 카운트.


- 이탈위험파들과 충성파들의 빈도분석 비교


1. 시계열 분석
- 충성파 중 생성 빈도가 가장 높은 Top 3 유저와 이탈 위험파 전원을 선별하여, 시간 흐름에 따른 서비스 이용 패턴(생성 횟수)을 비교 분석

<aside>
🚩

시계열 분석 대상:

- 충성파 Top 3: [9, 12, 15]
- 이탈위험파 전원: [np.int64(11), np.int64(14)]
</aside>


1. 최신성분석
- 충성파, 이탈위험파별 사용자가 마지막으로 플레이리스트를 생성한 시점 분석
