import { useState, useEffect } from "react";

// ── 초기 데이터 ──────────────────────────────────────────────
const INITIAL_TEACHERS = [
  {
    id: 1,
    name: "김수학",
    subject: "수학 (고등)",
    color: "#4f46e5",
    availableDays: ["Mon", "Wed", "Fri"],
    startTime: "14:00",
    endTime: "19:00",
  },
  {
    id: 2,
    name: "이대수",
    subject: "수학 (중등)",
    color: "#0891b2",
    availableDays: ["Tue", "Thu", "Sat"],
    startTime: "13:00",
    endTime: "18:00",
  },
  {
    id: 3,
    name: "박기하",
    subject: "수학 (초등)",
    color: "#059669",
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    startTime: "15:00",
    endTime: "18:00",
  },
];

const DAYS_KO = { Mon: "월", Tue: "화", Wed: "수", Thu: "목", Fri: "금", Sat: "토", Sun: "일" };
const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDayKey(date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateKo(date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${DAYS_KO[getDayKey(date)]})`;
}

function generateSlots(startTime, endTime) {
  const slots = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cur + 30 <= end) {
    const hh = String(Math.floor(cur / 60)).padStart(2, "0");
    const mm = String(cur % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
    cur += 30;
  }
  return slots;
}

function getNext14Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

// ── 메인 앱 ────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("book"); // "book" | "admin"
  const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
  const [bookings, setBookings] = useState([]); // {id, teacherId, date, slot, parentName, phone, memo}

  // book flow
  const [step, setStep] = useState(1); // 1=선생님선택 2=날짜선택 3=시간선택 4=정보입력 5=완료
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ parentName: "", phone: "", memo: "" });

  // admin
  const [adminTab, setAdminTab] = useState("bookings"); // "bookings" | "teachers"
  const [editingTeacher, setEditingTeacher] = useState(null);

  const days14 = getNext14Days();

  function isSlotBooked(teacherId, date, slot) {
    return bookings.some(b => b.teacherId === teacherId && b.date === date && b.slot === slot);
  }

  function handleBook() {
    const newBooking = {
      id: Date.now(),
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,
      date: formatDate(selectedDate),
      dateKo: formatDateKo(selectedDate),
      slot: selectedSlot,
      ...form,
    };
    setBookings(prev => [...prev, newBooking]);
    setStep(5);
  }

  function resetBook() {
    setStep(1);
    setSelectedTeacher(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setForm({ parentName: "", phone: "", memo: "" });
  }

  function cancelBooking(id) {
    if (confirm("예약을 취소하시겠습니까?")) {
      setBookings(prev => prev.filter(b => b.id !== id));
    }
  }

  // ── 선생님 편집 ──
  function saveTeacher(t) {
    setTeachers(prev => prev.map(x => x.id === t.id ? t : x));
    setEditingTeacher(null);
  }

  // ── 렌더 ──────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* 헤더 */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div>
            <div style={S.logo}>📐 상담예약</div>
            <div style={S.logoSub}>수학전문학원</div>
          </div>
          <div style={S.navBtns}>
            <button style={view === "book" ? S.navActive : S.navBtn} onClick={() => { setView("book"); resetBook(); }}>예약하기</button>
            <button style={view === "admin" ? S.navActive : S.navBtn} onClick={() => setView("admin")}>관리자</button>
          </div>
        </div>
      </header>

      <main style={S.main}>
        {view === "book" ? (
          <BookingView
            step={step} setStep={setStep}
            teachers={teachers}
            selectedTeacher={selectedTeacher} setSelectedTeacher={setSelectedTeacher}
            selectedDate={selectedDate} setSelectedDate={setSelectedDate}
            selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot}
            form={form} setForm={setForm}
            days14={days14}
            isSlotBooked={isSlotBooked}
            handleBook={handleBook}
            resetBook={resetBook}
          />
        ) : (
          <AdminView
            adminTab={adminTab} setAdminTab={setAdminTab}
            bookings={bookings} teachers={teachers}
            cancelBooking={cancelBooking}
            editingTeacher={editingTeacher} setEditingTeacher={setEditingTeacher}
            saveTeacher={saveTeacher}
          />
        )}
      </main>
    </div>
  );
}

// ── 예약 뷰 ───────────────────────────────────────────────────
function BookingView({ step, setStep, teachers, selectedTeacher, setSelectedTeacher, selectedDate, setSelectedDate, selectedSlot, setSelectedSlot, form, setForm, days14, isSlotBooked, handleBook, resetBook }) {

  const steps = ["선생님", "날짜", "시간", "정보", "완료"];

  return (
    <div style={S.card}>
      {/* 진행 표시 */}
      {step < 5 && (
        <div style={S.stepBar}>
          {steps.map((s, i) => (
            <div key={i} style={S.stepItem}>
              <div style={{ ...S.stepDot, background: step > i ? "#4f46e5" : step === i + 1 ? "#4f46e5" : "#e2e8f0", color: step >= i + 1 ? "#fff" : "#94a3b8" }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ ...S.stepLabel, color: step === i + 1 ? "#4f46e5" : "#94a3b8" }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Step 1: 선생님 선택 */}
      {step === 1 && (
        <div>
          <h2 style={S.title}>상담 선생님을 선택해주세요</h2>
          <div style={S.teacherGrid}>
            {teachers.map(t => (
              <button key={t.id} style={{ ...S.teacherCard, borderColor: t.color }} onClick={() => { setSelectedTeacher(t); setStep(2); }}>
                <div style={{ ...S.teacherAvatar, background: t.color }}>{t.name[0]}</div>
                <div style={S.teacherName}>{t.name} 선생님</div>
                <div style={S.teacherSubject}>{t.subject}</div>
                <div style={S.teacherDays}>
                  {ALL_DAYS.map(d => (
                    <span key={d} style={{ ...S.dayChip, background: t.availableDays.includes(d) ? t.color : "#f1f5f9", color: t.availableDays.includes(d) ? "#fff" : "#cbd5e1" }}>
                      {DAYS_KO[d]}
                    </span>
                  ))}
                </div>
                <div style={S.teacherTime}>{t.startTime} ~ {t.endTime}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: 날짜 선택 */}
      {step === 2 && (
        <div>
          <button style={S.back} onClick={() => setStep(1)}>← 뒤로</button>
          <h2 style={S.title}>{selectedTeacher.name} 선생님 · 날짜 선택</h2>
          <div style={S.dateGrid}>
            {days14.map(d => {
              const dayKey = getDayKey(d);
              const avail = selectedTeacher.availableDays.includes(dayKey);
              return (
                <button key={formatDate(d)}
                  disabled={!avail}
                  style={{ ...S.dateBtn, ...(avail ? {} : S.dateBtnDisabled), ...(selectedDate && formatDate(selectedDate) === formatDate(d) ? S.dateBtnActive : {}) }}
                  onClick={() => { if (avail) { setSelectedDate(d); setStep(3); } }}>
                  <div style={S.dateMon}>{d.getMonth() + 1}월</div>
                  <div style={S.dateDay}>{d.getDate()}</div>
                  <div style={S.dateWeek}>{DAYS_KO[dayKey]}</div>
                </button>
              );
            })}
          </div>
          <p style={S.hint}>회색 날짜는 상담 불가 요일입니다</p>
        </div>
      )}

      {/* Step 3: 시간 선택 */}
      {step === 3 && (
        <div>
          <button style={S.back} onClick={() => setStep(2)}>← 뒤로</button>
          <h2 style={S.title}>{formatDateKo(selectedDate)} · 시간 선택</h2>
          <p style={S.hint}>상담 시간은 30분 단위입니다</p>
          <div style={S.slotGrid}>
            {generateSlots(selectedTeacher.startTime, selectedTeacher.endTime).map(slot => {
              const booked = isSlotBooked(selectedTeacher.id, formatDate(selectedDate), slot);
              const [h, m] = slot.split(":").map(Number);
              const end = `${String(h + (m === 30 ? 1 : 0)).padStart(2, "0")}:${m === 30 ? "00" : "30"}`;
              return (
                <button key={slot} disabled={booked}
                  style={{ ...S.slotBtn, ...(booked ? S.slotBooked : {}), ...(selectedSlot === slot ? S.slotActive : {}) }}
                  onClick={() => { if (!booked) { setSelectedSlot(slot); setStep(4); } }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{slot}</span>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>~ {end}</span>
                  {booked && <span style={S.bookedTag}>예약됨</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: 정보 입력 */}
      {step === 4 && (
        <div>
          <button style={S.back} onClick={() => setStep(3)}>← 뒤로</button>
          <h2 style={S.title}>예약 정보 입력</h2>
          <div style={S.summaryBox}>
            <div style={S.summaryRow}><span>선생님</span><strong>{selectedTeacher.name} 선생님</strong></div>
            <div style={S.summaryRow}><span>날짜</span><strong>{formatDateKo(selectedDate)}</strong></div>
            <div style={S.summaryRow}><span>시간</span><strong>{selectedSlot} ~ {(() => { const [h,m]=selectedSlot.split(":").map(Number); return `${String(h+(m===30?1:0)).padStart(2,"0")}:${m===30?"00":"30"}`; })()}</strong></div>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>학부모 성함 *</label>
            <input style={S.input} placeholder="예) 홍길동" value={form.parentName}
              onChange={e => setForm(p => ({ ...p, parentName: e.target.value }))} />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>연락처 *</label>
            <input style={S.input} placeholder="예) 010-1234-5678" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>상담 내용 (선택)</label>
            <textarea style={{ ...S.input, height: 80, resize: "vertical" }} placeholder="상담하고 싶은 내용을 미리 적어주세요"
              value={form.memo} onChange={e => setForm(p => ({ ...p, memo: e.target.value }))} />
          </div>
          <button style={{ ...S.primaryBtn, opacity: form.parentName && form.phone ? 1 : 0.4 }}
            disabled={!form.parentName || !form.phone}
            onClick={handleBook}>예약 확정하기</button>
        </div>
      )}

      {/* Step 5: 완료 */}
      {step === 5 && (
        <div style={S.completeBox}>
          <div style={S.completeIcon}>✅</div>
          <h2 style={S.title}>예약이 완료되었습니다!</h2>
          <div style={S.summaryBox}>
            <div style={S.summaryRow}><span>선생님</span><strong>{selectedTeacher.name} 선생님</strong></div>
            <div style={S.summaryRow}><span>날짜</span><strong>{formatDateKo(selectedDate)}</strong></div>
            <div style={S.summaryRow}><span>시간</span><strong>{selectedSlot}</strong></div>
            <div style={S.summaryRow}><span>학부모</span><strong>{form.parentName}</strong></div>
            <div style={S.summaryRow}><span>연락처</span><strong>{form.phone}</strong></div>
          </div>
          <button style={S.primaryBtn} onClick={resetBook}>새 예약하기</button>
        </div>
      )}
    </div>
  );
}

// ── 관리자 뷰 ─────────────────────────────────────────────────
function AdminView({ adminTab, setAdminTab, bookings, teachers, cancelBooking, editingTeacher, setEditingTeacher, saveTeacher }) {
  return (
    <div style={S.card}>
      <h2 style={S.title}>관리자 페이지</h2>
      <div style={S.tabBar}>
        <button style={adminTab === "bookings" ? S.tabActive : S.tab} onClick={() => setAdminTab("bookings")}>
          예약 목록 <span style={S.badge}>{bookings.length}</span>
        </button>
        <button style={adminTab === "teachers" ? S.tabActive : S.tab} onClick={() => setAdminTab("teachers")}>
          선생님 설정
        </button>
      </div>

      {adminTab === "bookings" && (
        <div>
          {bookings.length === 0 ? (
            <div style={S.empty}>아직 예약이 없습니다</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...bookings].reverse().map(b => {
                const teacher = teachers.find(t => t.id === b.teacherId);
                return (
                  <div key={b.id} style={{ ...S.bookingCard, borderLeftColor: teacher?.color || "#4f46e5" }}>
                    <div style={S.bookingHeader}>
                      <div>
                        <strong>{b.parentName}</strong>
                        <span style={{ marginLeft: 8, color: "#64748b", fontSize: 13 }}>{b.phone}</span>
                      </div>
                      <button style={S.cancelBtn} onClick={() => cancelBooking(b.id)}>취소</button>
                    </div>
                    <div style={S.bookingMeta}>
                      <span>👨‍🏫 {b.teacherName} 선생님</span>
                      <span>📅 {b.dateKo}</span>
                      <span>🕐 {b.slot}</span>
                    </div>
                    {b.memo && <div style={S.bookingMemo}>💬 {b.memo}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {adminTab === "teachers" && (
        <div>
          {teachers.map(t => (
            <div key={t.id} style={{ ...S.bookingCard, borderLeftColor: t.color }}>
              {editingTeacher?.id === t.id ? (
                <TeacherEditor teacher={editingTeacher} setTeacher={setEditingTeacher} onSave={saveTeacher} onCancel={() => setEditingTeacher(null)} />
              ) : (
                <div>
                  <div style={S.bookingHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ ...S.teacherAvatar, background: t.color, width: 32, height: 32, fontSize: 14 }}>{t.name[0]}</div>
                      <div><strong>{t.name} 선생님</strong><span style={{ marginLeft: 8, color: "#64748b", fontSize: 13 }}>{t.subject}</span></div>
                    </div>
                    <button style={S.editBtn} onClick={() => setEditingTeacher({ ...t })}>수정</button>
                  </div>
                  <div style={S.bookingMeta}>
                    <span>📅 {t.availableDays.map(d => DAYS_KO[d]).join(", ")}</span>
                    <span>🕐 {t.startTime} ~ {t.endTime}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 선생님 편집기 ─────────────────────────────────────────────
function TeacherEditor({ teacher, setTeacher, onSave, onCancel }) {
  function toggleDay(d) {
    const days = teacher.availableDays.includes(d)
      ? teacher.availableDays.filter(x => x !== d)
      : [...teacher.availableDays, d];
    setTeacher(p => ({ ...p, availableDays: days }));
  }
  return (
    <div>
      <div style={S.formGroup}>
        <label style={S.label}>이름</label>
        <input style={S.input} value={teacher.name} onChange={e => setTeacher(p => ({ ...p, name: e.target.value }))} />
      </div>
      <div style={S.formGroup}>
        <label style={S.label}>과목</label>
        <input style={S.input} value={teacher.subject} onChange={e => setTeacher(p => ({ ...p, subject: e.target.value }))} />
      </div>
      <div style={S.formGroup}>
        <label style={S.label}>상담 가능 요일</label>
        <div style={{ display: "flex", gap: 6 }}>
          {ALL_DAYS.map(d => (
            <button key={d} style={{ ...S.dayToggle, background: teacher.availableDays.includes(d) ? teacher.color : "#f1f5f9", color: teacher.availableDays.includes(d) ? "#fff" : "#94a3b8" }}
              onClick={() => toggleDay(d)}>{DAYS_KO[d]}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ ...S.formGroup, flex: 1 }}>
          <label style={S.label}>시작 시간</label>
          <input style={S.input} type="time" value={teacher.startTime} onChange={e => setTeacher(p => ({ ...p, startTime: e.target.value }))} />
        </div>
        <div style={{ ...S.formGroup, flex: 1 }}>
          <label style={S.label}>종료 시간</label>
          <input style={S.input} type="time" value={teacher.endTime} onChange={e => setTeacher(p => ({ ...p, endTime: e.target.value }))} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button style={S.primaryBtn} onClick={() => onSave(teacher)}>저장</button>
        <button style={S.cancelBtn2} onClick={onCancel}>취소</button>
      </div>
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Noto Sans KR', sans-serif" },
  header: { background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 50 },
  headerInner: { maxWidth: 720, margin: "0 auto", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 20, fontWeight: 800, color: "#1e293b" },
  logoSub: { fontSize: 11, color: "#94a3b8", marginTop: -2 },
  navBtns: { display: "flex", gap: 8 },
  navBtn: { padding: "6px 16px", borderRadius: 20, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  navActive: { padding: "6px 16px", borderRadius: 20, border: "1.5px solid #4f46e5", background: "#4f46e5", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  main: { maxWidth: 720, margin: "0 auto", padding: "24px 16px" },
  card: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 20px rgba(0,0,0,0.07)", padding: "28px 24px" },
  stepBar: { display: "flex", justifyContent: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  stepDot: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 },
  stepLabel: { fontSize: 11, fontWeight: 600 },
  title: { fontSize: 20, fontWeight: 800, color: "#1e293b", marginBottom: 20, marginTop: 0 },
  back: { background: "none", border: "none", color: "#4f46e5", cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 12, padding: 0 },
  teacherGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 },
  teacherCard: { background: "#fff", border: "2px solid", borderRadius: 14, padding: "18px 14px", cursor: "pointer", textAlign: "center", transition: "transform .15s, box-shadow .15s", ":hover": { transform: "translateY(-2px)" } },
  teacherAvatar: { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 auto 10px" },
  teacherName: { fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 2 },
  teacherSubject: { fontSize: 12, color: "#64748b", marginBottom: 10 },
  teacherDays: { display: "flex", gap: 3, justifyContent: "center", marginBottom: 8 },
  dayChip: { width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 },
  teacherTime: { fontSize: 12, color: "#94a3b8", fontWeight: 600 },
  dateGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 12 },
  dateBtn: { borderRadius: 10, padding: "10px 4px", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", textAlign: "center", transition: "all .15s" },
  dateBtnDisabled: { background: "#f8fafc", color: "#cbd5e1", cursor: "not-allowed", border: "1.5px solid #f1f5f9" },
  dateBtnActive: { background: "#4f46e5", borderColor: "#4f46e5", color: "#fff" },
  dateMon: { fontSize: 10, color: "inherit", opacity: 0.6 },
  dateDay: { fontSize: 18, fontWeight: 800, color: "inherit" },
  dateWeek: { fontSize: 10, color: "inherit", opacity: 0.7 },
  hint: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  slotGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 },
  slotBtn: { borderRadius: 10, padding: "12px 8px", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "all .15s", position: "relative" },
  slotBooked: { background: "#f8fafc", color: "#cbd5e1", cursor: "not-allowed", border: "1.5px solid #f1f5f9" },
  slotActive: { background: "#4f46e5", borderColor: "#4f46e5", color: "#fff" },
  bookedTag: { fontSize: 10, background: "#fef2f2", color: "#ef4444", borderRadius: 4, padding: "1px 5px", marginTop: 2 },
  summaryBox: { background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 20 },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14, color: "#64748b", borderBottom: "1px solid #e2e8f0" },
  formGroup: { marginBottom: 14 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  primaryBtn: { width: "100%", padding: "13px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 },
  completeBox: { textAlign: "center", padding: "20px 0" },
  completeIcon: { fontSize: 56, marginBottom: 12 },
  tabBar: { display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid #f1f5f9", paddingBottom: 12 },
  tab: { padding: "7px 18px", borderRadius: 20, border: "none", background: "#f1f5f9", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  tabActive: { padding: "7px 18px", borderRadius: 20, border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  badge: { background: "#ef4444", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, marginLeft: 5 },
  empty: { textAlign: "center", color: "#94a3b8", padding: "40px 0", fontSize: 15 },
  bookingCard: { borderLeft: "4px solid", borderRadius: 10, padding: "14px 16px", background: "#fafafa", marginBottom: 4 },
  bookingHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  bookingMeta: { display: "flex", gap: 14, fontSize: 13, color: "#64748b", flexWrap: "wrap" },
  bookingMemo: { marginTop: 6, fontSize: 13, color: "#64748b", fontStyle: "italic" },
  cancelBtn: { padding: "4px 12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  cancelBtn2: { flex: 1, padding: "11px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  editBtn: { padding: "4px 12px", background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  dayToggle: { width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 },
};
