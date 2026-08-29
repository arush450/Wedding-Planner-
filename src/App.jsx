import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, Users, Wallet, ListChecks, Heart, Phone, MapPin } from "lucide-react";
import { subscribeToPlanner, savePlanner } from "./firebase";

const C = {
  ink: "#1F3D3D",
  marigold: "#E8A33D",
  sindoor: "#B23A48",
  ivory: "#FBF7EE",
  sage: "#8A9A7E",
  text: "#2A2A28",
  textMuted: "#7A776C",
  border: "#E4DCC8",
  cardBg: "#FFFFFF",
};

const FONT_DISPLAY = "Georgia, 'Iowan Old Style', 'Palatino Linotype', serif";
const FONT_BODY = "'Segoe UI', -apple-system, system-ui, sans-serif";
const FONT_MONO = "ui-monospace, 'SFMono-Regular', Menlo, monospace";

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultData = {
  eventDate: "",
  guests: [],
  budget: { total: "", items: [] },
  tasks: [],
};

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "inprogress", label: "In Progress" },
  { id: "done", label: "Done" },
];

function GarlandBar({ fraction = 0, count = 14, size = 10, color = C.marigold }) {
  const filled = Math.round(Math.min(Math.max(fraction, 0), 1) * count);
  return (
    <div style={{ position: "relative", height: size + 10, display: "flex", alignItems: "center" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: C.border }} />
      <div style={{ display: "flex", gap: 4, position: "relative", width: "100%", justifyContent: "space-between" }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              background: i < filled ? color : "#fff",
              border: `1.5px solid ${i < filled ? color : C.border}`,
              transform: `translateY(${i % 2 === 0 ? 0 : 4}px)`,
              boxShadow: i < filled ? "0 1px 2px rgba(0,0,0,0.18)" : "none",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, fraction }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textMuted, marginBottom: 10 }}>
        <Icon size={16} />
        <span style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FONT_BODY }}>{label}</span>
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: C.ink, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 10, fontFamily: FONT_BODY }}>{sub}</div>
      <GarlandBar fraction={fraction} count={12} size={7} />
    </div>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      style={{ fontFamily: FONT_BODY, fontSize: 14, padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", color: C.text, background: "#fff", ...props.style }}
    />
  );
}

function Select(props) {
  return (
    <select {...props} style={{ fontFamily: FONT_BODY, fontSize: 14, padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", color: C.text, background: "#fff", ...props.style }}>
      {props.children}
    </select>
  );
}

function Btn({ children, onClick, variant = "primary", style }) {
  const base = { fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 };
  const variants = {
    primary: { background: C.ink, color: "#fff" },
    ghost: { background: "transparent", color: C.sindoor, padding: "6px" },
  };
  return (
    <button type="button" onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function SectionHeader({ title, eyebrow }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: C.marigold, fontFamily: FONT_BODY, fontWeight: 700, marginBottom: 4 }}>{eyebrow}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.ink }}>{title}</div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [notice, setNotice] = useState("");
  const savingRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeToPlanner((remote) => {
      // Skip applying our own just-saved state back over local edits mid-flight.
      if (!savingRef.current) {
        setData(remote ? { ...defaultData, ...remote } : defaultData);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const persist = async (next) => {
    savingRef.current = true;
    try {
      await savePlanner(next);
      setNotice("");
    } catch (e) {
      console.error(e);
      setNotice("Could not save just now — check your connection and try again.");
    } finally {
      savingRef.current = false;
    }
  };

  const update = (updater) => {
    setData((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  };

  const guestStats = useMemo(() => ({ total: data.guests.length }), [data.guests]);

  const budgetStats = useMemo(() => {
    const total = parseFloat(data.budget.total) || 0;
    const spent = data.budget.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    return { total, spent, remaining: total - spent };
  }, [data.budget]);

  const taskStats = useMemo(() => {
    const total = data.tasks.length;
    const done = data.tasks.filter((t) => t.status === "done").length;
    return { total, done };
  }, [data.tasks]);

  const daysToGo = useMemo(() => {
    if (!data.eventDate) return null;
    return Math.ceil((new Date(data.eventDate) - new Date()) / 86400000);
  }, [data.eventDate]);

  const overallFraction = useMemo(() => {
    const parts = [];
    if (budgetStats.total) parts.push(Math.min(budgetStats.spent / budgetStats.total, 1));
    if (taskStats.total) parts.push(taskStats.done / taskStats.total);
    if (!parts.length) return 0;
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  }, [budgetStats, taskStats]);

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_BODY, color: C.textMuted, background: C.ivory }}>Loading your planner…</div>;
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Heart },
    { id: "guests", label: "Guests", icon: Users },
    { id: "budget", label: "Budget", icon: Wallet },
    { id: "tasks", label: "Tasks", icon: ListChecks },
  ];

  return (
    <div style={{ background: C.ivory, minHeight: "100vh", fontFamily: FONT_BODY, color: C.text }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "40px 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: C.marigold, marginBottom: 6 }}>Arush &amp; Sayee</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 40, color: C.ink, marginBottom: 10 }}>The Engagement Planner</div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <input type="date" value={data.eventDate} onChange={(e) => update((d) => ({ ...d, eventDate: e.target.value }))} style={{ fontFamily: FONT_MONO, fontSize: 13, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#fff", color: C.text }} />
            {daysToGo !== null && <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.sindoor }}>{daysToGo >= 0 ? `${daysToGo} days to go` : `${Math.abs(daysToGo)} days ago`}</span>}
          </div>
        </div>
        <GarlandBar fraction={overallFraction} count={24} size={9} />
        {notice && <div style={{ marginTop: 14, fontSize: 12.5, color: C.sindoor, textAlign: "center" }}>{notice}</div>}

        <div style={{ display: "flex", gap: 4, marginTop: 34, marginBottom: 30, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "10px 14px", background: "transparent", border: "none", borderBottom: active ? `2px solid ${C.marigold}` : "2px solid transparent", color: active ? C.ink : C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "overview" && (
          <div>
            <SectionHeader eyebrow="At a glance" title="How things stand" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              <StatCard icon={Users} label="Guests" value={guestStats.total} sub="on the list" fraction={guestStats.total ? 1 : 0} />
              <StatCard icon={Wallet} label="Budget" value={budgetStats.total ? `₹${budgetStats.spent.toLocaleString("en-IN")}` : "—"} sub={budgetStats.total ? `of ₹${budgetStats.total.toLocaleString("en-IN")} spent` : "set a total in Budget"} fraction={budgetStats.total ? budgetStats.spent / budgetStats.total : 0} />
              <StatCard icon={ListChecks} label="Tasks" value={`${taskStats.done}/${taskStats.total || 0}`} sub="done" fraction={taskStats.total ? taskStats.done / taskStats.total : 0} />
            </div>
          </div>
        )}

        {tab === "guests" && <GuestsTab data={data} update={update} />}
        {tab === "budget" && <BudgetTab data={data} update={update} stats={budgetStats} />}
        {tab === "tasks" && <TasksTab data={data} update={update} />}
      </div>
    </div>
  );
}

function GuestsTab({ data, update }) {
  const [form, setForm] = useState({ name: "", phone: "", location: "" });

  const addGuest = () => {
    if (!form.name.trim()) return;
    update((d) => ({ ...d, guests: [...d.guests, { id: uid(), ...form }] }));
    setForm({ name: "", phone: "", location: "" });
  };
  const removeGuest = (id) => update((d) => ({ ...d, guests: d.guests.filter((g) => g.id !== id) }));

  return (
    <div>
      <SectionHeader eyebrow={`${data.guests.length} on the list`} title="Guest list" />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
        <TextInput placeholder="Guest name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flex: "1 1 160px" }} />
        <TextInput placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ flex: "1 1 140px" }} />
        <TextInput placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={{ flex: "1 1 140px" }} />
        <Btn onClick={addGuest}><Plus size={14} /> Add</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.guests.length === 0 && <div style={{ color: C.textMuted, fontSize: 14 }}>No guests added yet.</div>}
        {data.guests.map((g) => (
          <div key={g.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{g.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12.5, color: C.textMuted }}>
              {g.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={13} /> {g.phone}</span>}
              {g.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {g.location}</span>}
              <Btn variant="ghost" onClick={() => removeGuest(g.id)}><Trash2 size={15} /></Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetTab({ data, update, stats }) {
  const [form, setForm] = useState({ expense: "", spentOn: "", amount: "", spentBy: "Arush" });

  const addItem = () => {
    if (!form.expense.trim()) return;
    update((d) => ({ ...d, budget: { ...d.budget, items: [...d.budget.items, { id: uid(), ...form }] } }));
    setForm({ expense: "", spentOn: "", amount: "", spentBy: "Arush" });
  };
  const removeItem = (id) => update((d) => ({ ...d, budget: { ...d.budget, items: d.budget.items.filter((i) => i.id !== id) } }));
  const setTotal = (val) => update((d) => ({ ...d, budget: { ...d.budget, total: val } }));

  return (
    <div>
      <SectionHeader eyebrow="Money matters" title="Budget & expenses" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: C.textMuted }}>Total budget (₹)</span>
        <TextInput type="number" value={data.budget.total} onChange={(e) => setTotal(e.target.value)} style={{ width: 140 }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: stats.remaining < 0 ? C.sindoor : C.sage }}>{stats.total ? `₹${stats.remaining.toLocaleString("en-IN")} remaining` : ""}</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
        <TextInput placeholder="Expense" value={form.expense} onChange={(e) => setForm({ ...form, expense: e.target.value })} style={{ flex: "1 1 140px" }} />
        <TextInput placeholder="What it was spent on" value={form.spentOn} onChange={(e) => setForm({ ...form, spentOn: e.target.value })} style={{ flex: "1 1 180px" }} />
        <TextInput type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: 110 }} />
        <Select value={form.spentBy} onChange={(e) => setForm({ ...form, spentBy: e.target.value })}>
          <option>Arush</option>
          <option>Sayee</option>
        </Select>
        <Btn onClick={addItem}><Plus size={14} /> Add</Btn>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.budget.items.length === 0 && <div style={{ color: C.textMuted, fontSize: 14 }}>No expenses logged yet.</div>}
        {data.budget.items.map((i) => (
          <div key={i.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{i.expense}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{i.spentOn || "—"} · paid by {i.spentBy}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.ink, fontWeight: 600 }}>₹{i.amount || 0}</span>
              <Btn variant="ghost" onClick={() => removeItem(i.id)}><Trash2 size={15} /></Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onDragStart, onRemove }) {
  const overdue = task.due && task.status !== "done" && new Date(task.due) < new Date(new Date().toDateString());
  return (
    <div draggable onDragStart={(e) => onDragStart(e, task.id)} style={{ background: C.cardBg, border: `1px solid ${overdue ? C.sindoor : C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: "grab" }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{task.title}</div>
      <div style={{ fontSize: 11.5, color: overdue ? C.sindoor : C.textMuted, display: "flex", justifyContent: "space-between" }}>
        <span>{task.assignee}</span>
        <span>{task.due || ""}{overdue ? " · overdue" : ""}</span>
      </div>
      <div style={{ textAlign: "right", marginTop: 4 }}>
        <Btn variant="ghost" onClick={() => onRemove(task.id)} style={{ padding: 2 }}><Trash2 size={13} /></Btn>
      </div>
    </div>
  );
}

function TasksTab({ data, update }) {
  const [form, setForm] = useState({ title: "", assignee: "Both", due: "" });

  const addTask = () => {
    if (!form.title.trim()) return;
    update((d) => ({ ...d, tasks: [...d.tasks, { id: uid(), ...form, status: "todo" }] }));
    setForm({ title: "", assignee: "Both", due: "" });
  };
  const removeTask = (id) => update((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  const moveTask = (id, status) => update((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }));

  const onDragStart = (e, id) => e.dataTransfer.setData("text/plain", id);
  const onDrop = (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    moveTask(id, status);
  };

  return (
    <div>
      <SectionHeader eyebrow={`${data.tasks.filter((t) => t.status === "done").length}/${data.tasks.length} done`} title="Tasks" />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
        <TextInput placeholder="Task" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ flex: "1 1 180px" }} />
        <Select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
          <option>Arush</option>
          <option>Sayee</option>
          <option>Both</option>
        </Select>
        <TextInput type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} style={{ width: 150 }} />
        <Btn onClick={addTask}><Plus size={14} /> Add</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {COLUMNS.map((col) => (
          <div key={col.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, col.id)} style={{ background: "#F4EEDD", borderRadius: 12, padding: 12, minHeight: 200 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.textMuted, marginBottom: 10 }}>
              {col.label} · {data.tasks.filter((t) => t.status === col.id).length}
            </div>
            {data.tasks.filter((t) => t.status === col.id).map((t) => (
              <TaskCard key={t.id} task={t} onDragStart={onDragStart} onRemove={removeTask} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 10 }}>Drag a card between columns to update its status.</div>
    </div>
  );
}
