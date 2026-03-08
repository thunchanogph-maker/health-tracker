"use client";

import { useState } from "react";
import { ref, remove, update } from "firebase/database";
import { db } from "./firebase";
import { MoodBadge } from "./page";

// ---- Mood options for edit modal ----
const MOODS = [
  { value: "great", emoji: "😄", label: "Great" },
  { value: "good",  emoji: "😊", label: "Good"  },
  { value: "okay",  emoji: "😐", label: "Okay"  },
  { value: "bad",   emoji: "😢", label: "Bad"   },
  { value: "awful", emoji: "😭", label: "Awful" },
];

const ITEMS_PER_PAGE = 5;

// ---- Confirm Delete Modal ----
function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
        <div className="text-4xl mb-3">🗑️</div>
        <h3 className="font-bold text-gray-800 text-lg mb-2">ลบรายการนี้?</h3>
        <p className="text-gray-500 text-sm mb-6">ข้อมูลจะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-5 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
            ยกเลิก
          </button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition">
            ลบเลย
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Single Record Card ----
function RecordCard({ record, onEdit, onDelete }) {
  const d = new Date(record.date);
  const dateStr = d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-500">📅 {dateStr}</span>
          <MoodBadge mood={record.mood} />
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onEdit(record)} className="p-2 rounded-xl bg-yellow-50 hover:bg-yellow-100 text-yellow-600 transition" title="แก้ไข">✏️</button>
          <button onClick={() => onDelete(record.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition" title="ลบ">🗑️</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        {[
          { icon: "💤", value: `${record.sleepHours}h`,          label: "นอน"      },
          { icon: "💧", value: `${record.waterIntake} แก้ว`,     label: "น้ำ"       },
          { icon: "🏃", value: `${record.exerciseMinutes} นาที`, label: "ออกกำลัง" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-xl py-2">
            <div className="text-lg">{s.icon}</div>
            <div className="text-xs font-bold text-gray-700">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stress bar */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500 w-20 shrink-0">😰 Stress</span>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              record.stressLevel <= 2 ? "bg-green-400" :
              record.stressLevel === 3 ? "bg-yellow-400" : "bg-red-400"
            }`}
            style={{ width: `${(record.stressLevel / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-gray-600 w-6">{record.stressLevel}/5</span>
      </div>

      {/* Note */}
      {record.note && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 mt-2 italic">
          📝 {record.note}
        </p>
      )}
    </div>
  );
}

// ---- Edit Modal ----
function EditModal({ record, onSave, onCancel }) {
  const [mood,            setMood]            = useState(record.mood);
  const [sleepHours,      setSleepHours]      = useState(record.sleepHours);
  const [waterIntake,     setWaterIntake]     = useState(record.waterIntake);
  const [exerciseMinutes, setExerciseMinutes] = useState(record.exerciseMinutes);
  const [stressLevel,     setStressLevel]     = useState(record.stressLevel);
  const [note,            setNote]            = useState(record.note || "");

  const handleSave = () => {
    onSave(record.id, { mood, sleepHours, waterIntake, exerciseMinutes, stressLevel, note });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-white text-lg">✏️ แก้ไขรายการ</h3>
          <button onClick={onCancel} className="text-white/80 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Date (read-only) */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📅 วันที่</label>
            <p className="mt-1 text-gray-700 font-semibold">{record.date}</p>
          </div>

          {/* Mood */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">🎭 อารมณ์</label>
            <div className="grid grid-cols-5 gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`flex flex-col items-center py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    mood === m.value
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 scale-105 shadow"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>{m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Number inputs */}
          {[
            { icon: "💤", label: "ชั่วโมงนอน",          value: sleepHours,      setValue: setSleepHours,      min: 0, max: 12,  step: 0.5 },
            { icon: "💧", label: "น้ำ (แก้ว)",           value: waterIntake,     setValue: setWaterIntake,     min: 0, max: 15,  step: 1   },
            { icon: "🏃", label: "ออกกำลังกาย (นาที)",  value: exerciseMinutes, setValue: setExerciseMinutes, min: 0, max: 120, step: 5   },
            { icon: "😰", label: "ระดับ Stress (1-5)",   value: stressLevel,     setValue: setStressLevel,     min: 1, max: 5,   step: 1   },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-xl w-7">{f.icon}</span>
              <label className="text-sm text-gray-600 flex-1">{f.label}</label>
              <input
                type="number"
                value={f.value}
                min={f.min} max={f.max} step={f.step}
                onChange={(e) => f.setValue(Number(e.target.value))}
                className="w-20 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm font-bold focus:ring-2 focus:ring-emerald-400 outline-none"
              />
            </div>
          ))}

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">📝 Note</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-emerald-400 outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
              ยกเลิก
            </button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:from-emerald-600 hover:to-teal-600 transition shadow-md">
              💾 บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ---- Main Component ----
// ✅ รับ records จาก page.js แทน (ไม่ต้อง fetch เอง)
// ============================================================
export default function HealthList({ user, records }) {
  const [editRecord,  setEditRecord]  = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [filterMood,  setFilterMood]  = useState("all");
  const [sortOrder,   setSortOrder]   = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // ---- UPDATE ----
  const handleUpdate = async (id, changes) => {
    await update(ref(db, `users/${user.uid}/healthRecords/${id}`), changes);
    setEditRecord(null);
  };

  // ---- DELETE ----
  const handleDelete = async () => {
    await remove(ref(db, `users/${user.uid}/healthRecords/${deleteId}`));
    setDeleteId(null);
    setCurrentPage(1);
  };

  // ---- Filter + Sort ----
  const filtered = records
    .filter((r) => filterMood === "all" || r.mood === filterMood)
    .sort((a, b) =>
      sortOrder === "desc"
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );

  // ---- Pagination ----
  const totalPages   = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx     = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleFilterChange = (val) => { setFilterMood(val); setCurrentPage(1); };

  // ---- Empty ----
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <span className="text-5xl">📭</span>
        <p className="font-semibold">ยังไม่มีรายการบันทึก</p>
        <p className="text-sm">ไปที่แท็บ ✏️ บันทึก เพื่อเพิ่มข้อมูลแรกของคุณ</p>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      {editRecord && (
        <EditModal record={editRecord} onSave={handleUpdate} onCancel={() => setEditRecord(null)} />
      )}
      {deleteId && (
        <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}

      {/* Filter & Sort toolbar */}
      <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: "all",   label: "ทั้งหมด" },
            { value: "great", label: "😄" },
            { value: "good",  label: "😊" },
            { value: "okay",  label: "😐" },
            { value: "bad",   label: "😢" },
            { value: "awful", label: "😭" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                filterMood === f.value
                  ? "bg-emerald-500 text-white border-emerald-500 shadow"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 font-semibold hover:bg-gray-50 transition"
        >
          {sortOrder === "desc" ? "🔽 ใหม่สุด" : "🔼 เก่าสุด"}
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        แสดง {currentItems.length} จาก {filtered.length} รายการ
      </p>

      {/* Record Cards */}
      {currentItems.length === 0 ? (
        <p className="text-center text-gray-400 py-10">ไม่มีรายการที่ตรงกับ Filter</p>
      ) : (
        <div className="space-y-3">
          {currentItems.map((r) => (
            <RecordCard key={r.id} record={r} onEdit={setEditRecord} onDelete={setDeleteId} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ← ก่อนหน้า
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-9 h-9 rounded-xl text-sm font-bold border transition-all ${
                currentPage === page
                  ? "bg-emerald-500 text-white border-emerald-500 shadow"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ถัดไป →
          </button>
        </div>
      )}
    </>
  );
}