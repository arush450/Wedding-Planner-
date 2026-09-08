import React, { useState, useEffect } from "react";
import { Check, X, Search } from "lucide-react";
import { fetchPlannerOnce, updateGuestRsvp } from "./firebase";

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

export default function RsvpPage() {
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState([]);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // "Yes" | "No"
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPlannerOnce();
        setGuests(data?.guests || []);
      } catch (e) {
        setError("Could not load the guest list. Please try again in a moment.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    setMatches(guests.filter((g) => g.name.toLowerCase().includes(q)));
    setSelected(null);
  };

  const submit = async (rsvp) => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      await updateGuestRsvp(selected.id, rsvp);
      setDone(rsvp);
    } catch (e) {
      setError("Something went wrong submitting your response — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const wrap = { background: C.ivory, minHeight: "100vh", fontFamily: FONT_BODY, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
  const card = { background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "32px 28px", maxWidth: 420, width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" };

  if (loading) {
    return <div style={wrap}><div style={{ color: C.textMuted }}>Loading…</div></div>;
  }

  if (done) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.ink, marginBottom: 10 }}>
            {done === "Yes" ? "Wonderful — see you there!" : "Thanks for letting us know"}
          </div>
          <div style={{ color: C.textMuted, fontSize: 14 }}>
            {done === "Yes" ? "We've marked you as attending. Can't wait to celebrate with you!" : "We've noted you won't be able to make it. We'll miss you!"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 12.5, letterSpacing: "0.1em", textTransform: "uppercase", color: C.marigold, marginBottom: 6 }}>Arush &amp; Sayee</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: C.ink }}>Will you be joining us?</div>
        </div>

        {!selected && (
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your full name"
              style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 15, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none" }}
            />
            <button type="submit" style={{ background: C.ink, color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>
              <Search size={16} />
            </button>
          </form>
        )}

        {!selected && matches.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {matches.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelected(g)}
                style={{ textAlign: "left", background: C.ivory, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 14 }}
              >
                <strong>{g.name}</strong>
                {g.location ? <span style={{ color: C.textMuted }}> · {g.location}</span> : null}
              </button>
            ))}
          </div>
        )}

        {!selected && query && matches.length === 0 && (
          <div style={{ fontSize: 13.5, color: C.textMuted, textAlign: "center" }}>
            Couldn't find that name — try just your first name, or check the spelling.
          </div>
        )}

        {selected && (
          <div>
            <div style={{ textAlign: "center", fontSize: 15, marginBottom: 4 }}>
              Hi <strong>{selected.name}</strong>!
            </div>
            <div style={{ textAlign: "center", fontSize: 13.5, color: C.textMuted, marginBottom: 18 }}>
              {selected.partySize > 1 ? `You're invited with your family — party of ${selected.partySize}.` : "Will you be attending?"}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                disabled={submitting}
                onClick={() => submit("Yes")}
                style={{ flex: 1, background: C.sage, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 600, fontSize: 14.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Check size={16} /> Attending
              </button>
              <button
                disabled={submitting}
                onClick={() => submit("No")}
                style={{ flex: 1, background: C.sindoor, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 600, fontSize: 14.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <X size={16} /> Can't make it
              </button>
            </div>
            <button onClick={() => setSelected(null)} style={{ marginTop: 14, background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer", width: "100%" }}>
              Not you? Search again
            </button>
          </div>
        )}

        {error && <div style={{ marginTop: 14, fontSize: 13, color: C.sindoor, textAlign: "center" }}>{error}</div>}
      </div>
    </div>
  );
}
