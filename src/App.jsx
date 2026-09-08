import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, Users, Wallet, ListChecks, Heart, Phone, MapPin, Upload, ClipboardList, Mail, Lock, Pencil } from "lucide-react";
import * as XLSX from "xlsx";
import confetti from "canvas-confetti";
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
  budget: { items: [] },
  tasks: [],
  loveNotes: { arush: "", sayee: "" },
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
      if (!savingRef.current) {
        setData(remote ? { ...defaultData, ...remote, budget: { items: [], ...remote.budget }, loveNotes: { arush: "", sayee: "", ...remote.loveNotes } } : defaultData);
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

  const guestStats = useMemo(() => {
    const families = data.guests.length;
    const totalHeadcount = data.guests.reduce((s, g) => s + (Number(g.partySize) || 1), 0);
    const confirmedHeadcount = data.guests.filter((g) => g.rsvp === "Yes").reduce((s, g) => s + (Number(g.partySize) || 1), 0);
    const declinedFamilies = data.guests.filter((g) => g.rsvp === "No").length;
    const pendingFamilies = data.guests.filter((g) => g.rsvp !== "Yes" && g.rsvp !== "No").length;
    return { families, totalHeadcount, confirmedHeadcount, declinedFamilies, pendingFamilies };
  }, [data.guests]);

  const budgetStats = useMemo(() => {
    const spent = data.budget.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    return { spent };
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

  const isMarried = daysToGo !== null && daysToGo < 0;

  const overallFraction = useMemo(() => {
    const parts = [];
    if (guestStats.totalHeadcount) parts.push(guestStats.confirmedHeadcount / guestStats.totalHeadcount);
    if (taskStats.total) parts.push(taskStats.done / taskStats.total);
    if (!parts.length) return 0;
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  }, [guestStats, taskStats]);

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_BODY, color: C.textMuted, background: C.ivory }}>Loading your planner…</div>;
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Heart },
    { id: "tasks", label: "Tasks", icon: ListChecks },
    { id: "guests", label: "Guests", icon: Users },
    { id: "budget", label: "Budget", icon: Wallet },
    { id: "notes", label: "Love Notes", icon: Mail },
  ];

  return (
    <div style={{ background: C.ivory, minHeight: "100vh", fontFamily: FONT_BODY, color: C.text }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "40px 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: C.marigold, marginBottom: 6 }}>Arush &amp; Sayee</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 40, color: C.ink, marginBottom: 10 }}>{isMarried ? "Married!" : "The Engagement Planner"}</div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <input type="date" value={data.eventDate} onChange={(e) => update((d) => ({ ...d, eventDate: e.target.value }))} style={{ fontFamily: FONT_MONO, fontSize: 13, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#fff", color: C.text }} />
            {daysToGo !== null && (
              <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.sindoor }}>
                {isMarried ? `${Math.abs(daysToGo)} days married 💍` : `${daysToGo} days to go`}
              </span>
            )}
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
              <StatCard icon={Users} label="Guests" value={`${guestStats.confirmedHeadcount}/${guestStats.totalHeadcount || 0}`} sub={`${guestStats.pendingFamilies} families pending · ${guestStats.declinedFamilies} declined`} fraction={guestStats.totalHeadcount ? guestStats.confirmedHeadcount / guestStats.totalHeadcount : 0} />
              <StatCard icon={Wallet} label="Spent so far" value={`₹${budgetStats.spent.toLocaleString("en-IN")}`} sub={`${data.budget.items.length} expense${data.budget.items.length === 1 ? "" : "s"} logged`} fraction={data.budget.items.length ? 1 : 0} />
              <StatCard icon={ListChecks} label="Tasks" value={`${taskStats.done}/${taskStats.total || 0}`} sub="done" fraction={taskStats.total ? taskStats.done / taskStats.total : 0} />
            </div>
          </div>
        )}

        {tab === "tasks" && <TasksTab data={data} update={update} />}
        {tab === "guests" && <GuestsTab data={data} update={update} guestStats={guestStats} />}
        {tab === "budget" && <BudgetTab data={data} update={update} stats={budgetStats} />}
        {tab === "notes" && <LoveNotesTab data={data} update={update} isMarried={isMarried} />}
      </div>
    </div>
  );
}

function GuestsTab({ data, update, guestStats }) {
  const [form, setForm] = useState({ name: "", phone: "", location: "", partySize: 1 });
  const [importMsg, setImportMsg] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef(null);

  const addGuest = () => {
    if (!form.name.trim()) return;
    update((d) => ({ ...d, guests: [...d.guests, { id: uid(), ...form, partySize: Number(form.partySize) || 1, rsvp: "Pending" }] }));
    setForm({ name: "", phone: "", location: "", partySize: 1 });
  };
  const removeGuest = (id) => update((d) => ({ ...d, guests: d.guests.filter((g) => g.id !== id) }));
  const setRsvp = (id, rsvp) => update((d) => ({ ...d, guests: d.guests.map((g) => (g.id === id ? { ...g, rsvp } : g)) }));

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const workbook = XLSX.read(buf);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const getVal = (row, keys) => {
        for (const k of Object.keys(row)) {
          if (keys.includes(k.trim().toLowerCase())) return String(row[k]).trim();
        }
        return "";
      };

      const newGuests = rows
        .map((row) => {
          const partyRaw = getVal(row, ["party size", "partysize", "guests", "count", "no. of guests", "pax", "total"]);
          const partySize = Math.max(1, parseInt(partyRaw, 10) || 1);
          return {
            id: uid(),
            rsvp: "Pending",
            name: getVal(row, ["name", "guest name", "guest"]),
            phone: getVal(row, ["phone", "number", "phone number", "contact", "mobile"]),
            location: getVal(row, ["location", "city", "address"]),
            partySize,
          };
        })
        .filter((g) => g.name);

      if (newGuests.length === 0) {
        setImportMsg("No guest names found — check the file has a \"Name\" column.");
      } else {
        update((d) => ({ ...d, guests: [...d.guests, ...newGuests] }));
        setImportMsg(`Imported ${newGuests.length} guest${newGuests.length === 1 ? "" : "s"}.`);
      }
    } catch (err) {
      console.error(err);
      setImportMsg("Could not read that file — make sure it's a .xlsx or .csv file.");
    } finally {
      e.target.value = "";
    }
  };

  const handlePasteImport = () => {
    const lines = pasteText.split("\n").map((l) => l.trim()).filter(Boolean);
    const newGuests = lines
      .map((line) => {
        const parts = line.split(/\t|,/).map((p) => p.trim());
        const partySize = Math.max(1, parseInt(parts[3], 10) || 1);
        return { id: uid(), name: parts[0] || "", phone: parts[1] || "", location: parts[2] || "", partySize, rsvp: "Pending" };
      })
      .filter((g) => g.name);

    if (newGuests.length === 0) {
      setImportMsg("Didn't find any names — put one guest per line, e.g. Name, Phone, Location, Party size.");
    } else {
      update((d) => ({ ...d, guests: [...d.guests, ...newGuests] }));
      setImportMsg(`Added ${newGuests.length} guest${newGuests.length === 1 ? "" : "s"}.`);
      setPasteText("");
      setPasteOpen(false);
    }
  };

  return (
    <div>
      <SectionHeader eyebrow={`${guestStats.families} families · ${guestStats.totalHeadcount} people total`} title="Guest list" />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
        <TextInput placeholder="Guest name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flex: "1 1 160px" }} />
        <TextInput placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ flex: "1 1 140px" }} />
        <TextInput placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={{ flex: "1 1 140px" }} />
        <TextInput type="number" min="1" placeholder="Total people" value={form.partySize} onChange={(e) => setForm({ ...form, partySize: e.target.value })} style={{ width: 110 }} />
        <Btn onClick={addGuest}><Plus size={14} /> Add</Btn>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} style={{ display: "none" }} />
        <Btn variant="ghost" style={{ color: C.ink, border: `1px solid ${C.border}`, background: C.cardBg }} onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} /> Import from Excel
        </Btn>
        <Btn variant="ghost" style={{ color: C.ink, border: `1px solid ${C.border}`, background: C.cardBg }} onClick={() => setPasteOpen((v) => !v)}>
          <ClipboardList size={14} /> Paste a list
        </Btn>
      </div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>"Total people" is the whole family/group under that name (include the guest themselves). Excel/paste can include this as a column too — defaults to 1 if left out.</div>

      {pasteOpen && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 8 }}>
            One guest per line: Name, Phone, Location, Total people — e.g. <code>Rahul Sharma, 9876543210, Mumbai, 4</code>. Only Name is required.
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            placeholder={"Rahul Sharma, 9876543210, Mumbai, 4\nPriya Nair, 9123456789, Pune, 1"}
            style={{ width: "100%", fontFamily: FONT_MONO, fontSize: 13, padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", resize: "vertical", boxSizing: "border-box" }}
          />
          <div style={{ marginTop: 10 }}>
            <Btn onClick={handlePasteImport}>Add these guests</Btn>
          </div>
        </div>
      )}

      {importMsg && <div style={{ fontSize: 12.5, color: C.sindoor, marginBottom: 14 }}>{importMsg}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.guests.length === 0 && <div style={{ color: C.textMuted, fontSize: 14 }}>No guests added yet.</div>}
        {data.guests.map((g) => (
          <div key={g.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{g.name} <span style={{ color: C.marigold, fontWeight: 700 }}>· {g.partySize || 1} total</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12.5, color: C.textMuted }}>
              {g.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={13} /> {g.phone}</span>}
              {g.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {g.location}</span>}
              <Select value={g.rsvp || "Pending"} onChange={(e) => setRsvp(g.id, e.target.value)} style={{ padding: "6px 10px", fontSize: 12.5, color: g.rsvp === "Yes" ? C.sage : g.rsvp === "No" ? C.sindoor : C.textMuted }}>
                <option>Pending</option>
                <option>Yes</option>
                <option>No</option>
              </Select>
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

  return (
    <div>
      <SectionHeader eyebrow={`₹${stats.spent.toLocaleString("en-IN")} logged so far`} title="Expenses" />

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

function TaskNotes({ task, onSave }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(task.notes || "");

  if (editing) {
    return (
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { setEditing(false); onSave(text); }}
        rows={2}
        style={{ width: "100%", fontFamily: FONT_BODY, fontSize: 12, padding: 6, borderRadius: 6, border: `1px solid ${C.border}`, outline: "none", resize: "vertical", boxSizing: "border-box", marginTop: 6 }}
      />
    );
  }

  return (
    <div onClick={() => setEditing(true)} style={{ marginTop: 6, fontSize: 12, color: task.notes ? C.text : C.textMuted, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 4 }}>
      <Pencil size={11} style={{ marginTop: 2, flexShrink: 0 }} />
      <span>{task.notes || "Add a note…"}</span>
    </div>
  );
}

function TaskCard({ task, onDragStart, onRemove, onSaveNotes }) {
  const overdue = task.due && task.status !== "done" && new Date(task.due) < new Date(new Date().toDateString());
  return (
    <div draggable onDragStart={(e) => onDragStart(e, task.id)} style={{ background: C.cardBg, border: `1px solid ${overdue ? C.sindoor : C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: "grab" }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{task.title}</div>
      <div style={{ fontSize: 11.5, color: overdue ? C.sindoor : C.textMuted, display: "flex", justifyContent: "space-between" }}>
        <span>{task.assignee}</span>
        <span>{task.due || ""}{overdue ? " · overdue" : ""}</span>
      </div>
      <TaskNotes task={task} onSave={(text) => onSaveNotes(task.id, text)} />
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
    update((d) => ({ ...d, tasks: [...d.tasks, { id: uid(), ...form, notes: "", status: "todo" }] }));
    setForm({ title: "", assignee: "Both", due: "" });
  };
  const removeTask = (id) => update((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));

  const moveTask = (id, status) => {
    update((d) => {
      const target = d.tasks.find((t) => t.id === id);
      if (target && target.status !== "done" && status === "done") {
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: ["#E8A33D", "#1F3D3D", "#B23A48", "#8A9A7E"] });
      }
      return { ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, status } : t)) };
    });
  };

  const saveNotes = (id, notes) => update((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, notes } : t)) }));

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
              <TaskCard key={t.id} task={t} onDragStart={onDragStart} onRemove={removeTask} onSaveNotes={saveNotes} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 10 }}>Drag a card between columns to update its status. Click a card's note line to edit it.</div>
    </div>
  );
}

function LoveNotesTab({ data, update, isMarried }) {
  const [me, setMe] = useState(() => localStorage.getItem("planner_identity") || "");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (me) setDraft(data.loveNotes?.[me] || "");
  }, [me, data.loveNotes]);

  const chooseIdentity = (who) => {
    localStorage.setItem("planner_identity", who);
    setMe(who);
  };

  const saveNote = () => {
    update((d) => ({ ...d, loveNotes: { ...d.loveNotes, [me]: draft } }));
  };

  const other = me === "arush" ? "sayee" : "arush";
  const otherLabel = other === "arush" ? "Arush" : "Sayee";
  const myLabel = me === "arush" ? "Arush" : "Sayee";

  if (!me) {
    return (
      <div>
        <SectionHeader eyebrow="A little surprise" title="Time-locked love notes" />
        <div style={{ color: C.textMuted, fontSize: 14, marginBottom: 16 }}>
          Write a private note now — it stays sealed until your wedding date arrives. Who's reading this?
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={() => chooseIdentity("arush")}>I'm Arush</Btn>
          <Btn onClick={() => chooseIdentity("sayee")}>I'm Sayee</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader eyebrow="A little surprise" title="Time-locked love notes" />

      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Your note, {myLabel}</div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveNote}
          rows={5}
          placeholder="Write something for your partner to read on your wedding day…"
          style={{ width: "100%", fontFamily: FONT_BODY, fontSize: 14, padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", resize: "vertical", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{otherLabel}'s note to you</div>
        {isMarried ? (
          data.loveNotes?.[other] ? (
            <div style={{ fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{data.loveNotes[other]}</div>
          ) : (
            <div style={{ color: C.textMuted, fontSize: 13.5 }}>{otherLabel} hasn't written one yet.</div>
          )
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textMuted, fontSize: 13.5 }}>
            <Lock size={14} /> Sealed until your wedding day
          </div>
        )}
      </div>

      <button onClick={() => { localStorage.removeItem("planner_identity"); setMe(""); }} style={{ marginTop: 14, background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
        Not {myLabel}? Switch
      </button>
    </div>
  );
}
