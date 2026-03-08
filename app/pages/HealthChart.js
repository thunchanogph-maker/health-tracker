"use client";

import { Bar, Pie, Line } from "react-chartjs-2";
import "chart.js/auto";

// ---- Helpers ----
const MOOD_ORDER  = ["awful", "bad", "okay", "good", "great"];
const MOOD_LABELS = { awful: "😭 Awful", bad: "😢 Bad", okay: "😐 Okay", good: "😊 Good", great: "😄 Great" };
const MOOD_COLORS = {
  awful: "#f87171", bad: "#fb923c", okay: "#fbbf24", good: "#34d399", great: "#4ade80",
};

const chartBase = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: { legend: { position: "top", labels: { font: { size: 12 }, boxWidth: 14 } } },
};

// ---- No Data Placeholder ----
function NoData() {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
      <span className="text-4xl">📭</span>
      <p className="text-sm">ยังไม่มีข้อมูล — ลองบันทึกสุขภาพดูก่อนนะคะ</p>
    </div>
  );
}

// ---- Chart Card Wrapper ----
function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h4 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2">{title}</h4>
      {children}
    </div>
  );
}

// ---- Summary Pill ----
function Pill({ icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${color}`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-bold text-gray-800 text-lg">{value}</div>
      </div>
    </div>
  );
}

// ---- Main Component ----
export default function HealthChart({ records }) {
  if (!records || records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <span className="text-5xl">📊</span>
        <p className="text-base font-semibold">ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์</p>
        <p className="text-sm">ไปที่แท็บ ✏️ บันทึก เพื่อเพิ่มข้อมูลก่อนนะคะ</p>
      </div>
    );
  }

  // ---- Sort records by date ----
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));

  // ---- Last 7 records for trend charts ----
  const last7 = sorted.slice(-7);
  const trendLabels = last7.map((r) => {
    const d = new Date(r.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  // ============================================================
  // 1. PIE — Mood distribution
  // ============================================================
  const moodCounts = MOOD_ORDER.reduce((acc, m) => ({ ...acc, [m]: 0 }), {});
  records.forEach((r) => { if (moodCounts[r.mood] !== undefined) moodCounts[r.mood]++; });
  const activeMoods = MOOD_ORDER.filter((m) => moodCounts[m] > 0);

  const moodPieData = {
    labels: activeMoods.map((m) => MOOD_LABELS[m]),
    datasets: [{
      data: activeMoods.map((m) => moodCounts[m]),
      backgroundColor: activeMoods.map((m) => MOOD_COLORS[m]),
      borderWidth: 2,
      borderColor: "#fff",
    }],
  };

  // ============================================================
  // 2. LINE — Sleep trend (last 7)
  // ============================================================
  const sleepLineData = {
    labels: trendLabels,
    datasets: [{
      label: "ชั่วโมงนอน",
      data: last7.map((r) => r.sleepHours),
      borderColor: "#60a5fa",
      backgroundColor: "rgba(96,165,250,0.15)",
      tension: 0.4,
      fill: true,
      pointBackgroundColor: "#3b82f6",
      pointRadius: 5,
    }],
  };
  const sleepOpts = {
    ...chartBase,
    scales: {
      y: { min: 0, max: 12, title: { display: true, text: "ชั่วโมง" } },
    },
  };

  // ============================================================
  // 3. BAR — Stress level per day (last 7)
  // ============================================================
  const stressColors = last7.map((r) => {
    if (r.stressLevel <= 2) return "#4ade80";
    if (r.stressLevel === 3) return "#fbbf24";
    return "#f87171";
  });

  const stressBarData = {
    labels: trendLabels,
    datasets: [{
      label: "ระดับความเครียด",
      data: last7.map((r) => r.stressLevel),
      backgroundColor: stressColors,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };
  const stressOpts = {
    ...chartBase,
    scales: {
      y: { min: 0, max: 5, ticks: { stepSize: 1 }, title: { display: true, text: "ระดับ (1-5)" } },
    },
  };

  // ============================================================
  // 4. BAR — Water & Exercise (last 7)
  // ============================================================
  const activityBarData = {
    labels: trendLabels,
    datasets: [
      {
        label: "💧 น้ำ (แก้ว)",
        data: last7.map((r) => r.waterIntake),
        backgroundColor: "rgba(34,211,238,0.7)",
        borderRadius: 6,
      },
      {
        label: "🏃 ออกกำลังกาย (x10 นาที)",
        data: last7.map((r) => (r.exerciseMinutes / 10).toFixed(1)),
        backgroundColor: "rgba(52,211,153,0.7)",
        borderRadius: 6,
      },
    ],
  };

  // ============================================================
  // Summary stats
  // ============================================================
  const n = records.length;
  const avg = (key) => (records.reduce((s, r) => s + (Number(r[key]) || 0), 0) / n).toFixed(1);
  const topMood = activeMoods.reduce((a, b) => (moodCounts[a] >= moodCounts[b] ? a : b), activeMoods[0]);

  return (
    <div className="space-y-6">

      {/* ── Summary Pills ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Pill icon="📋" label="บันทึกทั้งหมด"   value={`${n} วัน`}          color="bg-gray-50 border-gray-200"    />
        <Pill icon="💤" label="นอนเฉลี่ย"        value={`${avg("sleepHours")}h`}      color="bg-blue-50 border-blue-200"   />
        <Pill icon="💧" label="น้ำเฉลี่ย"        value={`${avg("waterIntake")} แก้ว`} color="bg-cyan-50 border-cyan-200"   />
        <Pill icon="😰" label="Stress เฉลี่ย"    value={`${avg("stressLevel")}/5`}    color="bg-red-50 border-red-200"     />
      </div>

      {/* ── Row 1: Mood Pie + Sleep Line ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <ChartCard title="🎭 สัดส่วน Mood ทั้งหมด">
          {activeMoods.length === 0 ? <NoData /> : (
            <div style={{ height: 220 }}>
              <Pie data={moodPieData} options={chartBase} />
            </div>
          )}
        </ChartCard>

        <ChartCard title="💤 แนวโน้มการนอน (7 วันล่าสุด)">
          {last7.length === 0 ? <NoData /> : (
            <div style={{ height: 220 }}>
              <Line data={sleepLineData} options={sleepOpts} />
            </div>
          )}
        </ChartCard>

      </div>

      {/* ── Row 2: Stress Bar + Activity Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <ChartCard title="😰 ระดับ Stress รายวัน (7 วันล่าสุด)">
          {last7.length === 0 ? <NoData /> : (
            <>
              <div style={{ height: 220 }}>
                <Bar data={stressBarData} options={stressOpts} />
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-500 justify-center">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block"/>1-2 ต่ำ</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"/>3 ปานกลาง</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"/>4-5 สูง</span>
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard title="💧🏃 น้ำ & ออกกำลังกาย (7 วันล่าสุด)">
          {last7.length === 0 ? <NoData /> : (
            <div style={{ height: 220 }}>
              <Bar data={activityBarData} options={chartBase} />
            </div>
          )}
        </ChartCard>

      </div>

      {/* ── Mood this week insight ── */}
      {topMood && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-600 mb-1">💡 Insight</p>
          <p className="text-gray-700">
            อารมณ์ที่บันทึกบ่อยที่สุดคือ{" "}
            <span className="font-bold">{MOOD_LABELS[topMood]}</span>{" "}
            ({moodCounts[topMood]} ครั้ง จากทั้งหมด {n} วัน)
          </p>
        </div>
      )}

    </div>
  );
}