"use client";

import { useState } from "react";
import { ref, push } from "firebase/database";
import { db } from "./firebase";

const MOODS = [
  { value: "great", emoji: "😄", label: "Great",  color: "border-green-400  bg-green-50  text-green-700"  },
  { value: "good",  emoji: "😊", label: "Good",   color: "border-blue-400   bg-blue-50   text-blue-700"   },
  { value: "okay",  emoji: "😐", label: "Okay",   color: "border-yellow-400 bg-yellow-50 text-yellow-700" },
  { value: "bad",   emoji: "😢", label: "Bad",    color: "border-orange-400 bg-orange-50 text-orange-700" },
  { value: "awful", emoji: "😭", label: "Awful",  color: "border-red-400    bg-red-50    text-red-700"    },
];

function Slider({ icon, label, value, onChange, min, max, step = 1, unit = "", color = "emerald" }) {
  const colors = {
    emerald: "accent-emerald-500",
    blue:    "accent-blue-500",
    red:     "accent-red-500",
    cyan:    "accent-cyan-500",
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
          <span>{icon}</span>{label}
        </label>
        <span className="text-sm font-bold text-gray-700 bg-gray-100 rounded-lg px-3 py-1">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-full cursor-pointer ${colors[color]}`}
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function HealthForm({ user }) {
  const today = new Date().toISOString().split("T")[0];

  // ── ค่าเริ่มต้นทั้งหมดเป็น 0 ──
  const [date,            setDate]            = useState(today);
  const [mood,            setMood]            = useState("okay");
  const [sleepHours,      setSleepHours]      = useState(0);
  const [waterIntake,     setWaterIntake]     = useState(0);
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  const [stressLevel,     setStressLevel]     = useState(1);
  const [note,            setNote]            = useState("");
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState(false);
  const [error,           setError]           = useState(null);

  const resetForm = () => {
    setDate(today);
    setMood("okay");
    setSleepHours(0);
    setWaterIntake(0);
    setExerciseMinutes(0);
    setStressLevel(1);
    setNote("");
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      setError("กรุณา Sign in ก่อนบันทึกข้อมูล");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const newRecord = {
        date,
        mood,
        sleepHours,
        waterIntake,
        exerciseMinutes,
        stressLevel,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      };

      await push(ref(db, `users/${user.uid}/healthRecords`), newRecord);

      setSuccess(true);
      resetForm(); // ── รีเซ็ตทุกค่าเป็น 0 หลังบันทึก ──
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("บันทึกข้อมูลไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-300 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold">
          <span className="text-lg">✅</span>
          บันทึกข้อมูลสำเร็จแล้วค่ะ!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-300 text-red-700 rounded-xl px-4 py-3 text-sm">
          <span className="text-lg">❌</span>
          {error}
        </div>
      )}

      {/* DATE */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">📅 วันที่บันทึก</label>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition"
        />
      </div>

      {/* MOOD */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-3">🎭 อารมณ์วันนี้เป็นอย่างไร?</label>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 font-semibold text-xs transition-all duration-200 ${
                mood === m.value
                  ? `${m.color} border-current shadow-md scale-105`
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* SLIDERS */}
      <div className="space-y-5 bg-gray-50 rounded-2xl p-5 border border-gray-100">
        <Slider icon="💤" label="ชั่วโมงการนอน"    value={sleepHours}      onChange={setSleepHours}      min={0} max={12}  step={0.5} unit="h"     color="blue"    />
        <Slider icon="💧" label="น้ำที่ดื่ม (แก้ว)" value={waterIntake}     onChange={setWaterIntake}     min={0} max={15}  unit=" แก้ว"             color="cyan"    />
        <Slider icon="🏃" label="ออกกำลังกาย"       value={exerciseMinutes} onChange={setExerciseMinutes} min={0} max={120} step={5}   unit=" นาที"  color="emerald" />
        <Slider icon="😰" label="ระดับความเครียด"   value={stressLevel}     onChange={setStressLevel}     min={1} max={5}   unit="/5"               color="red"     />
      </div>

      {/* NOTE */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          📝 บันทึกเพิ่มเติม <span className="text-gray-500 font-semibold">(ไม่บังคับ)</span>
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="เล่าให้ฟังหน่อยว่าวันนี้เป็นยังไงบ้าง..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 text-sm resize-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition"
        />
        <div className="text-right text-xs text-gray-400 mt-1">{note.length}/300</div>
      </div>

      {/* SUBMIT */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-3.5 rounded-xl font-bold text-white text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg active:scale-95"
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            กำลังบันทึก...
          </>
        ) : (
          <>💾 บันทึกข้อมูลสุขภาพ</>
        )}
      </button>

    </div>
  );
}