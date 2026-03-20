import { useState, useMemo, useEffect } from "react";

function getAgeMonths(birthDate, from = new Date()) {
  if (!birthDate) return 0;
  const b = new Date(birthDate);
  const y = from.getFullYear() - b.getFullYear();
  const m = from.getMonth() - b.getMonth();
  const d = from.getDate() - b.getDate();
  return Math.max(0, y * 12 + m + (d < 0 ? -1 : 0));
}

function getNextMonthBirthday(birthDate, from = new Date()) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const nextAge = getAgeMonths(birthDate, from) + 1;
  const months = nextAge + b.getFullYear() * 12 + b.getMonth();
  return new Date(Math.floor(months / 12), months % 12, b.getDate());
}

function formatNextUpdate(birthDate) {
  const d = getNextMonthBirthday(birthDate);
  if (!d) return "-";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const DEV_CRITERIA = {
  range_0_6:   { label:"0–6개월",   overview:"감각 자극 반응, 사회적 미소 시작, 옹알이, 눈 맞춤 발달", questionTypes:[
    { id:1, name:"감각 반응 질문",  example:"소리 들었어?",           area:"신체",    purpose:"청각·시각 자극 반응 언어화",      basis:"Stern (1985)" },
    { id:2, name:"표정 관찰 질문",  example:"웃었어? 어떤 표정이었어?", area:"사회정서", purpose:"사회적 미소·얼굴 인식 발달",      basis:"Trevarthen (1979)" },
  ]},
  range_6_12:  { label:"6–12개월",  overview:"옹알이 다양화, 공동 주의 시작, 낯가림, 대상 영속성 이해 시작", questionTypes:[
    { id:1, name:"공동 주의 질문",  example:"뭘 가리켰어? 거기 뭐 있었어?", area:"인지",    purpose:"공동 주의·지시하기 발달",         basis:"Tomasello (1995)" },
    { id:2, name:"감각 탐색 질문",  example:"만졌을 때 어땠어?",          area:"신체",    purpose:"촉각·감각 탐색 언어화",           basis:"Piaget 감각운동기" },
  ]},
  range_12_18: { label:"12–18개월", overview:"첫 단어 등장, 걷기 시작, 모방 놀이, 분리불안 절정", questionTypes:[
    { id:1, name:"첫 단어 연결 질문", example:"'맘마' 했어? 밥 먹고 싶었던 거야?", area:"언어",    purpose:"단어-의미 연결·어휘 확장",    basis:"Bates (1979)" },
    { id:2, name:"모방 질문",        example:"선생님이 한 거 따라 했어?",          area:"인지",    purpose:"모방 학습·사회적 인지",       basis:"Meltzoff (1988)" },
    { id:3, name:"신체 활동 질문",   example:"걸어갔어? 어디 갔어?",              area:"신체",    purpose:"이동 능력·공간 인식 언어화",  basis:"Thelen (1995)" },
    { id:4, name:"감정 표현 질문",   example:"싫었어? 좋았어?",                   area:"사회정서", purpose:"기본 감정 어휘 이해",         basis:"Reese & Fivush (1993)" },
  ]},
  range_18_23: { label:"18–23개월", overview:"어휘 폭발기, 단어 조합 시작, 상징 놀이 시작, 자아 인식 강화", questionTypes:[
    { id:1, name:"어휘 확장 질문",  example:"그게 뭐야? 이름이 뭐야?", area:"언어",    purpose:"어휘 폭발기 단어 연결 촉진",   basis:"Bloom (2000)" },
    { id:2, name:"상징 놀이 질문",  example:"인형한테 밥 줬어?",       area:"인지",    purpose:"상징적 표상·가작 놀이",        basis:"Piaget 전조작기" },
    { id:3, name:"자기 인식 질문",  example:"이게 누구야? 내 거야?",   area:"사회정서", purpose:"자아 인식·소유 개념",          basis:"Lewis (1992)" },
    { id:4, name:"감각 탐색 질문",  example:"만져봤어? 어땠어?",       area:"신체",    purpose:"감각 경험 언어화",             basis:"Iverson (2010)" },
    { id:5, name:"경험 회상 질문",  example:"아까 뭐 했어?",           area:"언어",    purpose:"단기 기억 회상·경험 언어화",   basis:"Nelson (1996)" },
  ]},
  range_23_24: { label:"23–24개월", overview:"2단어 조합 발화, 상징적 사고 시작, 평행놀이 → 초기 협력놀이 전환기", questionTypes:[
    { id:1, name:"감정 질문",       example:"동그라미 놀이 재미있었어?",            area:"사회정서", purpose:"감정 언어·감정 이해·사건 회상",         basis:"Reese & Fivush (1993)" },
    { id:2, name:"또래 관계 질문",  example:"오늘 어떤 친구랑 놀았어?",             area:"사회정서", purpose:"사회적 인지·이름-얼굴 매칭·사회적 언어", basis:"Tomasello (2003)" },
    { id:3, name:"경험 회상 질문",  example:"오늘 어린이집에서 뭐 했어?",           area:"언어",    purpose:"사건 설명 능력·경험 언어화·기억 회상",  basis:"Nelson (1996)" },
    { id:4, name:"탐색 질문",       example:"종이를 찢으니까 뭐가 나왔어?",         area:"인지",    purpose:"원인-결과 이해·탐색 행동 언어화",       basis:"Gopnik (2009)" },
    { id:5, name:"예측·관찰 질문",  example:"종이를 뿌리면 어떻게 내려왔어?",       area:"인지",    purpose:"관찰 언어·물리적 세계 이해·초기 과학적 사고", basis:"Baillargeon (2004)" },
    { id:6, name:"선택형 질문",     example:"큰 동그라미였어? 작은 동그라미였어?",   area:"언어",    purpose:"동사 어휘·언어 산출·선택 표현",         basis:"Hoff (2006)" },
    { id:7, name:"신체 감각 질문",  example:"공을 차니까 발이 어땠어?",             area:"신체",    purpose:"신체 인식·감각 표현·동작 언어",         basis:"Iverson (2010)" },
    { id:8, name:"자기 행동 질문",  example:"스스로 공 넣었어?",                   area:"인지",    purpose:"자기효능감·자기 행동 인식·자기조절",     basis:"Vygotsky (1978)" },
    { id:9, name:"감각 표현 질문",  example:"종이가 눈처럼 떨어질 때 어땠어?",      area:"언어",    purpose:"감각 언어·감정 표현·상징적 언어",        basis:"Bloom (2000)" },
  ]},
  range_24_26: { label:"24–26개월", overview:"3단어 조합 발화 시작, '왜?' 질문 등장, 역할 놀이 확장, 자아 주장 강화", questionTypes:[
    { id:1, name:"감정 질문",       example:"오늘 제일 재미있었던 게 뭐야?",        area:"사회정서", purpose:"감정 어휘 확장·감정 원인 이해·사건 평가", basis:"Reese & Fivush (1993)" },
    { id:2, name:"이유 질문",       example:"왜 그게 좋았어?",                     area:"인지",    purpose:"초기 인과 언어·'왜' 개념 형성·설명 능력", basis:"Gopnik (2009)" },
    { id:3, name:"순서 질문",       example:"밥 먹고 나서 뭐 했어?",               area:"언어",    purpose:"사건 순서화·시간 개념·서사 구조 형성",   basis:"Nelson (1996)" },
    { id:4, name:"역할 놀이 질문",  example:"오늘 인형이랑 뭐 했어?",              area:"사회정서", purpose:"상징적 사고·역할 개념·pretend play 언어화", basis:"Piaget / Vygotsky" },
    { id:5, name:"탐색 질문",       example:"그걸 눌렀을 때 어떻게 됐어?",          area:"인지",    purpose:"원인-결과 이해·탐색 행동 언어화",         basis:"Gopnik (2009)" },
    { id:6, name:"선택·비교 질문",  example:"사과랑 바나나 중에 어느 게 더 좋아?",  area:"언어",    purpose:"비교 언어·선호 표현·어휘 확장",           basis:"Hoff (2006)" },
    { id:7, name:"신체 감각 질문",  example:"밖에 나가니까 바람이 어땠어?",         area:"신체",    purpose:"신체 인식·환경 감각 표현·형용사 어휘",   basis:"Iverson (2010)" },
    { id:8, name:"자기 행동 질문",  example:"스스로 해봤어?",                      area:"인지",    purpose:"자기효능감·자기 행동 인식·자율성 강화",   basis:"Vygotsky (1978)" },
    { id:9, name:"친구 감정 질문",  example:"친구가 울었을 때 어땠어?",             area:"사회정서", purpose:"공감 능력·타인 감정 인식·초기 조망수용",  basis:"Tomasello (2003)" },
  ]},
  range_26_28: { label:"26–28개월", overview:"3~4단어 문장 사용, 이야기 구조 형성 시작, 규칙·역할 이해, 상상 놀이 복잡화", questionTypes:[
    { id:1, name:"이야기 구성 질문", example:"처음엔 뭐부터 했어?",                  area:"언어",    purpose:"narrative 구성·시간 순서·사건 설명 능력", basis:"Nelson (1996)" },
    { id:2, name:"이유·원인 질문",  example:"왜 그렇게 됐을까?",                    area:"인지",    purpose:"인과 추론·설명 언어·논리적 사고 초기",   basis:"Gopnik (2009)" },
    { id:3, name:"규칙·역할 질문",  example:"그 놀이는 어떻게 하는 거야?",           area:"사회정서", purpose:"규칙 이해·역할 개념·사회적 지식",         basis:"Vygotsky" },
    { id:4, name:"상상 질문",       example:"만약에 새처럼 날 수 있으면 어디 가고 싶어?", area:"인지", purpose:"상상력·반사실적 사고 초기·창의 언어",   basis:"Harris (2000)" },
    { id:5, name:"비교·분류 질문",  example:"이거랑 저거 어떻게 달라?",              area:"인지",    purpose:"범주화·비교 언어·분류 사고",             basis:"Piaget 전조작기" },
    { id:6, name:"감정 원인 질문",  example:"왜 기뻤어?",                          area:"사회정서", purpose:"감정 원인 설명·감정 어휘 심화·자기 이해", basis:"Reese & Fivush (1993)" },
    { id:7, name:"타인 관점 질문",  example:"친구는 어떤 기분이었을까?",             area:"사회정서", purpose:"조망수용·공감·Theory of Mind 초기",       basis:"Wellman (1992)" },
    { id:8, name:"신체·운동 질문",  example:"달리기 할 때 몸이 어떤 느낌이었어?",    area:"신체",    purpose:"신체 인식·운동 감각 언어·자기 신체 이해", basis:"Iverson (2010)" },
    { id:9, name:"선호·의견 질문",  example:"어떤 게 더 좋았어? 왜?",               area:"언어",    purpose:"의견 표현·선호 언어·자기 주장 발달",     basis:"Hoff (2006)" },
  ]},
  range_28_30: { label:"28–30개월", overview:"4~5단어 문장, 과거·미래 시제 사용, Theory of Mind 발달, 협력 놀이 활발", questionTypes:[
    { id:1, name:"서사 질문",       example:"오늘 있었던 일 다 얘기해줄 수 있어?",  area:"언어",    purpose:"narrative 구성·사건 평가·언어 유창성",   basis:"Nelson (1996)" },
    { id:2, name:"미래 예측 질문",  example:"내일은 뭐 하고 싶어?",                area:"인지",    purpose:"미래 시제 이해·계획 언어·자기 목표 표현", basis:"Suddendorf & Corballis (2007)" },
    { id:3, name:"마음 읽기 질문",  example:"친구가 왜 그렇게 했을까?",             area:"사회정서", purpose:"Theory of Mind·의도 이해·타인 행동 해석", basis:"Wellman (1992)" },
    { id:4, name:"문제 해결 질문",  example:"어떻게 하면 됐어?",                   area:"인지",    purpose:"문제 해결 언어·전략 설명·자기 효능감",   basis:"Gopnik (2009)" },
    { id:5, name:"감정 조절 질문",  example:"속상했을 때 어떻게 했어?",             area:"사회정서", purpose:"정서 조절 언어·coping strategy·자기조절", basis:"Gross (2002)" },
    { id:6, name:"비교·분류 질문",  example:"동물이랑 자동차는 뭐가 달라?",         area:"인지",    purpose:"범주 비교·추론·언어 복잡성",             basis:"Piaget 전조작기" },
    { id:7, name:"협력 놀이 질문",  example:"친구랑 같이 만들 때 어떻게 나눴어?",   area:"사회정서", purpose:"협력·역할 분담 이해·사회적 언어",         basis:"Tomasello (2003)" },
    { id:8, name:"감각·환경 질문",  example:"오늘 밖에 날씨가 어땠어?",             area:"신체",    purpose:"환경 인식·기상 어휘·감각 언어 확장",     basis:"Bloom (2000)" },
    { id:9, name:"의견·이유 질문",  example:"왜 그게 좋아?",                       area:"언어",    purpose:"의견 표현·이유 설명·메타인지 초기",      basis:"Hoff (2006)" },
  ]},
  range_30_36: { label:"30–36개월", overview:"5단어 이상 문장, 과거·현재·미래 시제 구사, Theory of Mind 완성, 협상·설득 언어 등장", questionTypes:[
    { id:1, name:"스토리텔링 질문",     example:"오늘 일을 이야기처럼 말해줄 수 있어?",   area:"언어",    purpose:"완전한 narrative 구성·기승전결 구조",     basis:"Nelson (1996)" },
    { id:2, name:"반사실 가정 질문",    example:"만약 선생님이 없었으면 어떻게 됐을까?",   area:"인지",    purpose:"counterfactual thinking·상상 추론",      basis:"Harris (2000)" },
    { id:3, name:"Theory of Mind 질문", example:"친구는 그게 뭔지 알았을까?",             area:"사회정서", purpose:"false belief 이해·타인 지식 상태 추론",    basis:"Wellman (1992)" },
    { id:4, name:"협상·설득 질문",      example:"친구한테 같이 하자고 어떻게 말했어?",     area:"사회정서", purpose:"설득 언어·사회적 문제 해결·협상 전략",    basis:"Tomasello (2003)" },
    { id:5, name:"메타인지 질문",       example:"그걸 어떻게 알았어?",                    area:"인지",    purpose:"메타인지 초기·앎의 과정 인식",            basis:"Flavell (1979)" },
    { id:6, name:"감정 조절 전략 질문", example:"화났을 때 어떻게 하면 좋을까?",           area:"사회정서", purpose:"정서 조절 전략·자기조절 언어화",           basis:"Gross (2002)" },
    { id:7, name:"도덕·규칙 질문",      example:"그건 왜 하면 안 돼?",                    area:"사회정서", purpose:"규칙 이해·도덕 추론 초기·사회 규범",      basis:"Turiel (1983)" },
    { id:8, name:"계획·순서 질문",      example:"내일 어린이집 가면 뭐부터 할 거야?",      area:"인지",    purpose:"계획 수립·미래 순서 언어·실행 기능",      basis:"Suddendorf & Corballis (2007)" },
    { id:9, name:"창의 확장 질문",      example:"그 놀이를 더 재미있게 하려면?",           area:"인지",    purpose:"창의적 사고·문제 개선·언어 복잡성",       basis:"Gopnik (2009)" },
  ]},
  range_36_48: { label:"36–48개월", overview:"복문 사용, Theory of Mind 완성, 규칙 있는 게임 이해, 정서 조절 능력 발달", questionTypes:[
    { id:1, name:"복합 감정 질문",   example:"기쁘면서 무서웠어?",           area:"사회정서", purpose:"복합 감정 이해·정서 언어 심화",    basis:"Reese & Fivush (1993)" },
    { id:2, name:"규칙 이해 질문",   example:"그 게임은 어떤 규칙이 있어?",  area:"인지",    purpose:"규칙 체계 이해·사회적 규범 언어화", basis:"Piaget" },
    { id:3, name:"친구 관계 질문",   example:"왜 그 친구가 좋아?",          area:"사회정서", purpose:"우정 개념·사회적 관계 언어화",     basis:"Tomasello (2003)" },
    { id:4, name:"이야기 만들기 질문", example:"그다음엔 어떻게 됐어?",      area:"언어",    purpose:"서사 구성·창의적 언어·상상력",     basis:"Nelson (1996)" },
    { id:5, name:"감정 조절 질문",   example:"화날 때 어떻게 해?",          area:"사회정서", purpose:"정서 조절 전략·자기조절 언어화",   basis:"Gross (2002)" },
  ]},
};

function getCriteria(m) {
  if (m < 6)  return DEV_CRITERIA.range_0_6;
  if (m < 12) return DEV_CRITERIA.range_6_12;
  if (m < 18) return DEV_CRITERIA.range_12_18;
  if (m < 23) return DEV_CRITERIA.range_18_23;
  if (m < 24) return DEV_CRITERIA.range_23_24;
  if (m < 26) return DEV_CRITERIA.range_24_26;
  if (m < 28) return DEV_CRITERIA.range_26_28;
  if (m < 30) return DEV_CRITERIA.range_28_30;
  if (m < 36) return DEV_CRITERIA.range_30_36;
  return DEV_CRITERIA.range_36_48;
}

const AREA_STYLE = {
  "언어":    { bg:"#FEF3E8", color:"#93550A", dot:"#F4845F" },
  "인지":    { bg:"#E8F1FD", color:"#1A4F8B", dot:"#4A90D9" },
  "사회정서": { bg:"#EAF3DE", color:"#3B6D11", dot:"#5BAD3A" },
  "신체":    { bg:"#F3EAF8", color:"#6B2B8B", dot:"#A855D4" },
};

const STORAGE_KEY  = "anyi_history_v2";
const SETTINGS_KEY = "anyi_settings_v2";

async function loadStorage(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
async function saveStorage(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error(e); }
}

export default function App() {
  const today    = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [settings,       setSettings]       = useState({ childName:"", birthDate:"" });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [inputName,      setInputName]      = useState("");
  const [inputBirth,     setInputBirth]     = useState("");
  const [savedMsg,       setSavedMsg]       = useState(false);

  const [tab,            setTab]            = useState("generate");
  const [selectedDate,   setSelectedDate]   = useState(todayStr);
  const [note,           setNote]           = useState("");
  const [manualTopic,    setManualTopic]    = useState("");
  const [useManualTopic, setUseManualTopic] = useState(false);
  const [result,         setResult]         = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [history,        setHistory]        = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedId,     setExpandedId]     = useState(null);

  useEffect(() => {
    Promise.all([loadStorage(SETTINGS_KEY), loadStorage(STORAGE_KEY)]).then(([s, h]) => {
      if (s) { setSettings(s); setInputName(s.childName||""); setInputBirth(s.birthDate||""); }
      else   { setTab("settings"); }
      setHistory(h || []);
      setHistoryLoading(false);
      setSettingsLoaded(true);
    });
  }, []);

  const ageMonths  = useMemo(() => getAgeMonths(settings.birthDate, today), [settings.birthDate]);
  const criteria   = useMemo(() => getCriteria(ageMonths), [ageMonths]);
  const childName  = settings.childName || "아이";
  const isReady    = !!settings.birthDate;
  const nextUpd    = useMemo(() => formatNextUpdate(settings.birthDate), [settings.birthDate]);

  const recentActivities = useMemo(() => {
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - 3);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return history.filter(h => h.date >= cutoffStr).map(h => h.result?.selected_activity).filter(Boolean);
  }, [history, todayStr]);

  const systemPrompt = useMemo(() => {
    const types = criteria.questionTypes.map(q =>
      `[${q.id}. ${q.name}] 발달목표: ${q.purpose} / 근거: ${q.basis}`
    ).join("\n");
    const avoidBlock = recentActivities.length > 0
      ? `\n\n⚠️ 최근 3일 이내 이미 선택한 대화 주제 (반드시 피할 것):\n${recentActivities.map(a=>`- ${a}`).join("\n")}\n위 주제와 동일하거나 매우 유사한 활동은 선택하지 마세요.`
      : "";
    const manualBlock = (useManualTopic && manualTopic.trim())
      ? `\n\n✅ 부모가 직접 지정한 대화 주제: "${manualTopic.trim()}"\n위 주제를 selected_activity로 반드시 사용하세요.`
      : "";
    return `당신은 영유아 발달 전문가입니다. 현재 ${childName}(${ageMonths}개월)의 발달 단계에 맞춰 부모-자녀 대화 질문을 설계합니다.
발달 단계 (${criteria.label}): ${criteria.overview}
질문 유형:
${types}${avoidBlock}${manualBlock}
반드시 JSON만 출력. 마크다운 코드블록 없이:
{"selected_activity":"활동명","activity_description":"한 줄 요약","questions":[{"question":"질문 (${childName}에게 말하는 말투)","type_name":"질문 유형명","purpose":"발달 목표","tip":"부모 대처법","development_area":"언어 또는 인지 또는 사회정서 또는 신체"}]}`;
  }, [ageMonths, criteria, recentActivities, manualTopic, useManualTopic, childName]);

  const saveSettings = async () => {
    const s = { childName: inputName.trim(), birthDate: inputBirth };
    setSettings(s);
    await saveStorage(SETTINGS_KEY, s);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
    if (s.birthDate) setTab("generate");
  };

  const deleteHistory = async (id) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    if (expandedId === id) setExpandedId(null);
    await saveStorage(STORAGE_KEY, updated);
  };

  const updateHistoryDate = async (id, newDate) => {
    const updated = history.map(h => h.id === id ? { ...h, date: newDate } : h);
    setHistory(updated);
    await saveStorage(STORAGE_KEY, updated);
  };

  const generate = async () => {
    if (!note.trim() || loading) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role:"user", content:`다음 알림장에서 대화하기 좋은 활동 1개 선택 후, ${ageMonths}개월 ${childName} 발달을 위한 질문 5개를 JSON으로만 출력하세요.\n\n${note}` }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = (data.content||[]).map(c=>c.text||"").join("");
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setResult(parsed);
      const entry = { id:Date.now(), date:selectedDate, ageMonths, note:note.slice(0,200), result:parsed };
      const updated = [entry, ...history].slice(0,10);
      setHistory(updated);
      await saveStorage(STORAGE_KEY, updated);
    } catch(e) {
      setError("오류: " + (e.message||"다시 시도해주세요."));
    } finally { setLoading(false); }
  };

  const groupedHistory = useMemo(() => {
    const g = {};
    history.forEach(item => { const ym=item.date.slice(0,7); if(!g[ym])g[ym]=[]; g[ym].push(item); });
    return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0]));
  }, [history]);

  const QCards = ({ questions }) => (
    <div>
      {(questions||[]).map((q,i) => {
        const s = AREA_STYLE[q.development_area]||AREA_STYLE["언어"];
        return (
          <div key={i} style={{ background:"#fff", border:"1px solid #EDE8E4", borderRadius:12, padding:"14px 16px", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:"#F4845F", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</div>
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:s.bg, color:s.color }}>{q.development_area}</span>
              {q.type_name && <span style={{ fontSize:10, color:"#9E8E85" }}>{q.type_name}</span>}
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:"#2D2420", lineHeight:1.55, marginBottom:10 }}>"{q.question}"</div>
            <div style={{ borderTop:"1px solid #F0EBE7", paddingTop:9, display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ display:"flex", gap:7, fontSize:11.5, lineHeight:1.5 }}>
                <span style={{ fontWeight:700, color:"#9E8E85", whiteSpace:"nowrap" }}>발달 목표</span>
                <span style={{ color:"#5A504A" }}>{q.purpose}</span>
              </div>
              <div style={{ display:"flex", gap:7, fontSize:11.5, lineHeight:1.5 }}>
                <span style={{ fontWeight:700, color:"#9E8E85", whiteSpace:"nowrap" }}>부모 팁</span>
                <span style={{ color:"#5A504A" }}>{q.tip}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!settingsLoaded) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Apple SD Gothic Neo','Noto Sans KR',sans-serif", color:"#9E8E85" }}>
      불러오는 중...
    </div>
  );

  return (
    <div style={{ fontFamily:"'Apple SD Gothic Neo','Noto Sans KR',sans-serif", maxWidth:580, margin:"0 auto", padding:"20px 16px 56px", background:"#FDFAF7", minHeight:"100vh", color:"#2D2420" }}>

      {/* 헤더 */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <span style={{ fontSize:30 }}>🌱</span>
          <div>
            <div style={{ fontSize:19, fontWeight:700, letterSpacing:"-0.4px" }}>{childName}의 발달 대화 질문</div>
            <div style={{ fontSize:12, color:"#9E8E85", marginTop:2 }}>키즈노트 알림장 → 개월수 맞춤 발달 질문</div>
          </div>
          {/* 설정 바로가기 */}
          <button onClick={() => setTab("settings")} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", fontSize:18, padding:4, opacity:0.6 }}>⚙️</button>
        </div>
        {isReady && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#E8621A", background:"#FFF0E6", border:"1px solid #F4C4A6", borderRadius:20, padding:"4px 11px" }}>👶 {ageMonths}개월 · {criteria.label}</span>
            <span style={{ fontSize:11, color:"#3B6D11", background:"#F0F9E8", border:"1px solid #C0DD97", borderRadius:20, padding:"4px 11px" }}>🔄 다음 업데이트 {nextUpd}</span>
            <span style={{ fontSize:11, color:"#1A4F8B", background:"#E8F1FD", border:"1px solid #B5D4F4", borderRadius:20, padding:"4px 11px" }}>📅 기록 {history.length}개</span>
          </div>
        )}
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", marginBottom:16, background:"#F0EBE7", borderRadius:10, padding:3 }}>
        {[["generate","✨ 질문 만들기"],["history","📅 히스토리"],["criteria","📋 발달 기준"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ flex:1, padding:"9px 2px", fontSize:11, fontWeight:tab===k?700:500, background:tab===k?"#fff":"transparent", color:tab===k?"#2D2420":"#9E8E85", border:"none", borderRadius:8, cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
        ))}
      </div>

      {/* ── 설정 탭 ── */}
      {tab === "settings" && (
        <div>
          <div style={{ background:"#fff", border:"1px solid #EDE8E4", borderRadius:16, padding:"20px", marginBottom:12, boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#2D2420", marginBottom:16 }}>👶 아이 정보</div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#9E8E85", marginBottom:6 }}>아이 이름</label>
              <input value={inputName} onChange={e => setInputName(e.target.value)}
                placeholder="예) 안이, 지우, 민준..."
                style={{ width:"100%", border:"1.5px solid #DDD8D4", borderRadius:10, padding:"11px 13px", fontSize:14, background:"#FDFAF7", color:"#2D2420", fontFamily:"inherit", boxSizing:"border-box", outline:"none" }}
              />
            </div>

            <div style={{ marginBottom:6 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#9E8E85", marginBottom:6 }}>생년월일</label>
              <input type="date" value={inputBirth} onChange={e => setInputBirth(e.target.value)}
                style={{ width:"100%", border:"1.5px solid #DDD8D4", borderRadius:10, padding:"11px 13px", fontSize:14, background:"#FDFAF7", color:"#2D2420", fontFamily:"inherit", boxSizing:"border-box", outline:"none" }}
              />
            </div>

            {/* 미리보기 */}
            {inputBirth && (
              <div style={{ background:"#FFF0E6", border:"1px solid #F4C4A6", borderRadius:10, padding:"11px 13px", marginTop:12 }}>
                <div style={{ fontSize:13, color:"#E8621A", fontWeight:700 }}>
                  현재 {getAgeMonths(inputBirth, today)}개월 · {getCriteria(getAgeMonths(inputBirth, today)).label} 기준 적용
                </div>
                <div style={{ fontSize:11, color:"#C07040", marginTop:4, lineHeight:1.5 }}>
                  생일마다 자동으로 다음 개월수 발달 기준으로 업데이트돼요
                </div>
                <div style={{ fontSize:11, color:"#C07040", marginTop:2 }}>
                  🔄 다음 업데이트: {formatNextUpdate(inputBirth)}
                </div>
              </div>
            )}
          </div>

          <button onClick={saveSettings} disabled={!inputBirth}
            style={{ width:"100%", padding:"14px 0", background:!inputBirth?"#E0D8D4":"#F4845F", color:"white", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:!inputBirth?"not-allowed":"pointer", transition:"background 0.15s" }}>
            {savedMsg ? "✅ 저장됐어요!" : "저장하기"}
          </button>
          {!inputBirth && <div style={{ textAlign:"center", fontSize:12, color:"#C0B8B0", marginTop:8 }}>생년월일을 입력해야 저장할 수 있어요</div>}
        </div>
      )}

      {/* ── 질문 만들기 탭 ── */}
      {tab === "generate" && (
        <div>
          {!isReady && (
            <div style={{ background:"#FFF0E6", border:"1px solid #F4C4A6", borderRadius:12, padding:"14px 16px", marginBottom:14, display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:18 }}>⚙️</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#E8621A", marginBottom:2 }}>설정이 필요해요</div>
                <div style={{ fontSize:12, color:"#C07040" }}>아이 생년월일을 먼저 입력해주세요.</div>
              </div>
              <button onClick={() => setTab("settings")} style={{ padding:"7px 14px", background:"#F4845F", color:"white", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>설정하기</button>
            </div>
          )}

          {recentActivities.length > 0 && (
            <div style={{ background:"#FFF8E8", border:"1px solid #F4E4A0", borderRadius:12, padding:"11px 14px", marginBottom:12, display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>🚫</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#7A6A40", marginBottom:5 }}>최근 3일 내 사용한 주제 — 자동 제외됩니다</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {recentActivities.map((a,i) => (
                    <span key={i} style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:"#F0E8C8", color:"#7A6A40", fontWeight:600, textDecoration:"line-through" }}>{a}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 직접 주제 입력 */}
          <div style={{ background:"#fff", border:"1px solid #EDE8E4", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
            <button onClick={() => { setUseManualTopic(v=>!v); setManualTopic(""); }}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", cursor:"pointer", padding:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14 }}>✏️</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#2D2420" }}>주제 직접 입력하기</span>
                {useManualTopic && manualTopic.trim() && <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20, background:"#E8F1FD", color:"#1A4F8B" }}>적용 중</span>}
              </div>
              <span style={{ fontSize:11, color:"#9E8E85" }}>{useManualTopic ? "▲" : "▼"}</span>
            </button>
            {useManualTopic && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:12, color:"#9E8E85", marginBottom:8, lineHeight:1.5 }}>대화하고 싶은 주제를 직접 입력하면 그 주제에 맞는 질문을 뽑아드려요.</div>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={manualTopic} onChange={e=>setManualTopic(e.target.value)}
                    placeholder="예) 점심 먹기, 친구와 블록 쌓기..."
                    style={{ flex:1, border:"1.5px solid #DDD8D4", borderRadius:10, padding:"9px 12px", fontSize:13, background:"#FDFAF7", color:"#2D2420", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
                  />
                  {manualTopic.trim() && <button onClick={() => setManualTopic("")} style={{ padding:"9px 12px", background:"#F5F2F0", border:"none", borderRadius:10, fontSize:12, color:"#9E8E85", cursor:"pointer" }}>✕</button>}
                </div>
                {manualTopic.trim() && <div style={{ marginTop:8, fontSize:12, color:"#1A4F8B", background:"#E8F1FD", borderRadius:8, padding:"7px 10px" }}>"{manualTopic.trim()}" 주제로 질문을 만들게요.</div>}
              </div>
            )}
          </div>

          {/* 알림장 입력 */}
          <div style={{ background:"#fff", border:"1px solid #EDE8E4", borderRadius:14, padding:18, marginBottom:12, boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
            {/* 날짜 선택 */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, paddingBottom:13, borderBottom:"1px solid #F0EBE7" }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#4A3F3A" }}>알림장 날짜</label>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={todayStr}
                  style={{ border:"1.5px solid #DDD8D4", borderRadius:9, padding:"6px 10px", fontSize:13, background:"#FDFAF7", color:"#2D2420", fontFamily:"inherit", outline:"none" }}
                />
                {selectedDate !== todayStr && (
                  <button onClick={() => setSelectedDate(todayStr)}
                    style={{ fontSize:11, padding:"5px 10px", background:"#F5F2F0", border:"none", borderRadius:8, color:"#9E8E85", cursor:"pointer", whiteSpace:"nowrap" }}>
                    오늘로
                  </button>
                )}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#4A3F3A" }}>선생님이 써주신 알림장 내용</label>
              {note.trim() && (
                <button onClick={() => { setNote(""); setResult(null); setError(""); }}
                  style={{ fontSize:11, padding:"4px 10px", background:"#F5F2F0", border:"none", borderRadius:8, color:"#9E8E85", cursor:"pointer" }}>
                  내용 비우기
                </button>
              )}
            </div>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={5}
              placeholder="예시) 오늘 바깥 놀이 시간에 모래놀이를 했어요. '차가워!'라고 말하며 좋아했어요..."
              style={{ width:"100%", border:"1.5px solid #DDD8D4", borderRadius:10, padding:"10px 12px", fontSize:13, lineHeight:1.7, resize:"vertical", background:"#FDFAF7", color:"#2D2420", fontFamily:"inherit", boxSizing:"border-box" }}
            />
            <button onClick={generate} disabled={!note.trim()||loading||!isReady}
              style={{ marginTop:12, width:"100%", padding:"13px 0", background:(!note.trim()||loading||!isReady)?"#E0D8D4":"#F4845F", color:"white", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:(!note.trim()||loading||!isReady)?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {loading
                ? <><span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>분석 중...</>
                : useManualTopic && manualTopic.trim()
                  ? `✏️ "${manualTopic.trim()}" 주제로 질문 만들기`
                  : `✨ ${ageMonths}개월 맞춤 질문 만들기`}
            </button>
          </div>

          {error && <div style={{ background:"#FEE8E8", border:"1px solid #FACACA", borderRadius:10, padding:"11px 14px", color:"#C0392B", fontSize:13, marginBottom:12 }}>{error}</div>}

          {result && (
            <div>
              <div style={{ background:"linear-gradient(135deg,#F4845F,#E8621A)", borderRadius:14, padding:"18px 20px", marginBottom:12, color:"white" }}>
                <div style={{ fontSize:11, fontWeight:600, opacity:0.8, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:5 }}>오늘의 대화 주제</div>
                <div style={{ fontSize:18, fontWeight:800, marginBottom:4, letterSpacing:"-0.4px" }}>{result.selected_activity}</div>
                <div style={{ fontSize:13, opacity:0.9, lineHeight:1.5 }}>{result.activity_description}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:"#4A3F3A", marginBottom:10 }}>💬 {ageMonths}개월 맞춤 발달 질문 5가지</div>
              <QCards questions={result.questions} />
              <div style={{ background:"#FFFBF0", border:"1px solid #F4E4A0", borderRadius:12, padding:"12px 14px", fontSize:12, color:"#7A6A40", lineHeight:1.7, marginTop:4 }}>
                📌 아이가 대답 못해도 괜찮아요. 3~5초 기다린 후 부모가 먼저 짧게 모델링해 주세요.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 히스토리 탭 ── */}
      {tab === "history" && (
        <div>
          {historyLoading ? (
            <div style={{ textAlign:"center", padding:"48px 0", color:"#9E8E85", fontSize:14 }}>불러오는 중...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign:"center", padding:"56px 20px" }}>
              <div style={{ fontSize:42, marginBottom:12 }}>📭</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#4A3F3A", marginBottom:6 }}>아직 기록이 없어요</div>
              <div style={{ fontSize:13, color:"#9E8E85" }}>질문 만들기 탭에서 알림장을 분석하면 여기에 저장돼요</div>
            </div>
          ) : (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
                {[["총 기록",`${history.length}개`],["이번 달",`${history.filter(h=>h.date.slice(0,7)===todayStr.slice(0,7)).length}개`],["최근",history[0]?`${parseInt(history[0].date.slice(8))}일`:"-"]].map(([l,v])=>(
                  <div key={l} style={{ background:"#fff", border:"1px solid #EDE8E4", borderRadius:10, padding:"12px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:"#F4845F" }}>{v}</div>
                    <div style={{ fontSize:11, color:"#9E8E85", marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
              {groupedHistory.map(([ym, items]) => {
                const [yr, mo] = ym.split("-");
                return (
                  <div key={ym} style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#4A3F3A" }}>{yr}년 {parseInt(mo)}월</div>
                      <div style={{ flex:1, height:"0.5px", background:"#DDD8D4" }}/>
                      <div style={{ fontSize:11, color:"#9E8E85" }}>{items.length}회</div>
                    </div>
                    {items.map(item => {
                      const isOpen = expandedId === item.id;
                      const r = item.result;
                      const areas = [...new Set((r?.questions||[]).map(q=>q.development_area))];
                      return (
                        <div key={item.id} style={{ background:"#fff", border:"1px solid #EDE8E4", borderRadius:14, marginBottom:8, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                          <div style={{ display:"flex", alignItems:"center" }}>
                            <button onClick={() => setExpandedId(isOpen?null:item.id)}
                              style={{ flex:1, display:"flex", alignItems:"center", gap:12, padding:"14px 12px 14px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left", minWidth:0 }}>
                              <div style={{ width:40, height:40, borderRadius:10, background:"#FFF0E6", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"visible", position:"relative" }}>
                                <input
                                  type="date"
                                  value={item.date}
                                  onChange={e => { e.stopPropagation(); updateHistoryDate(item.id, e.target.value); }}
                                  onClick={e => e.stopPropagation()}
                                  style={{ position:"absolute", opacity:0, inset:0, width:"100%", height:"100%", cursor:"pointer", zIndex:2 }}
                                />
                                <div style={{ fontSize:16, fontWeight:800, color:"#E8621A", lineHeight:1 }}>{parseInt(item.date.slice(8))}</div>
                                <div style={{ fontSize:9, color:"#F4845F", fontWeight:600, marginTop:1 }}>{parseInt(item.date.slice(5,7))}월</div>
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                                  <span style={{ fontSize:14, fontWeight:700, color:"#2D2420", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r?.selected_activity||"활동"}</span>
                                  <span style={{ fontSize:10, color:"#9E8E85", background:"#F5F2F0", borderRadius:6, padding:"1px 6px", flexShrink:0 }}>{item.ageMonths}개월</span>
                                </div>
                                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                  {areas.map(a => { const s=AREA_STYLE[a]||AREA_STYLE["언어"]; return <span key={a} style={{ fontSize:10, fontWeight:600, padding:"1px 7px", borderRadius:20, background:s.bg, color:s.color }}>{a}</span>; })}
                                </div>
                              </div>
                              <span style={{ fontSize:11, color:"#C0B8B0", flexShrink:0 }}>{isOpen?"▲":"▼"}</span>
                            </button>
                            <button onClick={() => deleteHistory(item.id)}
                              style={{ padding:"0 14px", height:"100%", minHeight:68, background:"none", border:"none", borderLeft:"1px solid #F0EBE7", cursor:"pointer", color:"#C0B8B0", fontSize:14, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}
                              title="삭제">✕</button>
                          </div>
                          {isOpen && (
                            <div style={{ borderTop:"1px solid #F0EBE7", padding:"14px 16px 16px" }}>
                              {item.note && (
                                <div style={{ background:"#FDFAF7", border:"1px solid #EDE8E4", borderRadius:9, padding:"10px 12px", marginBottom:12 }}>
                                  <div style={{ fontSize:10, fontWeight:700, color:"#9E8E85", marginBottom:4 }}>📝 알림장 원문</div>
                                  <div style={{ fontSize:12, color:"#5A504A", lineHeight:1.65 }}>{item.note}{item.note.length>=200?"...":""}</div>
                                </div>
                              )}
                              <div style={{ background:"linear-gradient(135deg,#F4845F,#E8621A)", borderRadius:10, padding:"12px 14px", marginBottom:12, color:"white" }}>
                                <div style={{ fontSize:10, opacity:0.8, marginBottom:3 }}>대화 주제</div>
                                <div style={{ fontSize:15, fontWeight:800 }}>{r?.selected_activity}</div>
                                <div style={{ fontSize:12, opacity:0.9, marginTop:2 }}>{r?.activity_description}</div>
                              </div>
                              <QCards questions={r?.questions}/>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div style={{ textAlign:"center", fontSize:11, color:"#C0B8B0", paddingTop:4 }}>최근 10개까지 저장됩니다</div>
            </div>
          )}
        </div>
      )}

      {/* ── 발달 기준 탭 ── */}
      {tab === "criteria" && (
        <div>
          <div style={{ background:"#fff", border:"1px solid #EDE8E4", borderRadius:14, padding:"16px 18px", marginBottom:12 }}>
            <div style={{ fontSize:12, color:"#9E8E85", marginBottom:3 }}>현재 적용 기준</div>
            <div style={{ fontSize:17, fontWeight:700, color:"#2D2420", marginBottom:6 }}>{criteria.label}</div>
            <div style={{ fontSize:13, color:"#5A504A", lineHeight:1.6, background:"#FDFAF7", borderRadius:8, padding:"10px 12px" }}>{criteria.overview}</div>
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:"#4A3F3A", marginBottom:10 }}>📚 이번 달 질문 유형</div>
          {criteria.questionTypes.map(q => {
            const s = AREA_STYLE[q.area]||AREA_STYLE["언어"];
            return (
              <div key={q.id} style={{ background:"#fff", border:"1px solid #EDE8E4", borderRadius:12, padding:"14px 16px", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", background:s.dot, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, flexShrink:0 }}>{q.id}</div>
                  <span style={{ fontSize:13, fontWeight:700, color:"#2D2420" }}>{q.name}</span>
                  <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20, background:s.bg, color:s.color, marginLeft:"auto" }}>{q.area}</span>
                </div>
                <div style={{ fontSize:13, color:"#6B5F58", fontStyle:"italic", marginBottom:6, paddingLeft:28 }}>예) "{q.example}"</div>
                <div style={{ paddingLeft:28 }}>
                  <div style={{ fontSize:12, color:"#5A504A", marginBottom:3 }}><span style={{ fontWeight:600, color:"#9E8E85" }}>발달 목표 </span>{q.purpose}</div>
                  <div style={{ fontSize:11, color:"#9E8E85" }}>{q.basis}</div>
                </div>
              </div>
            );
          })}
          <div style={{ background:"#F0F9E8", border:"1px solid #C0DD97", borderRadius:12, padding:"13px 15px", fontSize:12, color:"#3B6D11", lineHeight:1.7, marginTop:4 }}>
            🔄 다음 기준 업데이트: <strong>{nextUpd}</strong> ({ageMonths+1}개월 기준으로 자동 전환됩니다)
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea:focus { outline: none; border-color: #F4845F !important; }
        textarea::placeholder { color: #C0B8B0; }
        input:focus { border-color: #F4845F !important; }
      `}</style>
    </div>
  );
}
