"use client";

import { useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { SectionHead } from "@/components/ui/SectionHead";
import { IconCamera, IconClose } from "@/components/icons";
import { useProgressPhotos, type ProgressPhoto } from "@/hooks/useProgressPhotos";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";

const mono = "var(--font-mono)";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "2-digit" });
}

function daysBetween(a: string, b: string) {
  return Math.abs(Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000));
}

export function ProgressPhotos({ defaultWeight }: { defaultWeight?: number | null }) {
  const { photos, loading, uploading, addPhoto, deletePhoto } = useProgressPhotos();
  const { remove, isPending } = useUndoableDelete(
    (id) => deletePhoto(id),
    { label: "Foto eliminada" }
  );

  const fileRef = useRef<HTMLInputElement | null>(null);

  // Subida: archivo elegido + metadata pendiente de confirmar.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [noteInput, setNoteInput] = useState("");

  // Detalle y comparación.
  const [viewing, setViewing] = useState<ProgressPhoto | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSel, setCompareSel] = useState<string[]>([]);

  const visible = useMemo(() => photos.filter((p) => !isPending(p.id)), [photos, isPending]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setPendingFile(f);
    setPendingPreview(URL.createObjectURL(f));
    setWeightInput(defaultWeight != null ? String(defaultWeight) : "");
    setNoteInput("");
  }

  function closeUpload() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    const kg = parseFloat(weightInput.replace(",", "."));
    const res = await addPhoto(pendingFile, {
      weight_kg: Number.isFinite(kg) && kg > 0 ? kg : null,
      note: noteInput,
    });
    if (!res.error) closeUpload();
  }

  function toggleCompare(id: string) {
    setCompareSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  }

  function exitCompare() {
    setCompareMode(false);
    setCompareSel([]);
  }

  const compareA = visible.find((p) => p.id === compareSel[0]);
  const compareB = visible.find((p) => p.id === compareSel[1]);

  return (
    <>
      <SectionHead
        title="Progreso"
        action={visible.length >= 2 ? (compareMode ? "Cerrar" : "Comparar") : undefined}
        onAction={visible.length >= 2 ? () => (compareMode ? exitCompare() : setCompareMode(true)) : undefined}
      />

      <div style={{ padding: "0 20px" }}>
        {compareMode && (
          <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: mono, marginBottom: 10, letterSpacing: "0.02em" }}>
            Elegí 2 fotos para comparar · {compareSel.length}/2
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {/* Botón agregar */}
          {!compareMode && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="kilo-pressable"
              style={{
                aspectRatio: "3 / 4", borderRadius: 14,
                background: "rgba(198,255,80,0.06)",
                border: "1px dashed rgba(198,255,80,0.4)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                cursor: uploading ? "wait" : "pointer", color: "var(--lime)",
              }}
            >
              {uploading ? (
                <span style={{ fontSize: 11, fontFamily: mono }}>subiendo…</span>
              ) : (
                <>
                  <IconCamera size={22} color="var(--lime)" />
                  <span style={{ fontSize: 10.5, fontFamily: mono, letterSpacing: "0.03em" }}>Agregar</span>
                </>
              )}
            </button>
          )}

          {visible.map((p) => {
            const selIdx = compareSel.indexOf(p.id);
            return (
              <button
                key={p.id}
                onClick={() => (compareMode ? toggleCompare(p.id) : setViewing(p))}
                className="kilo-pressable"
                style={{
                  aspectRatio: "3 / 4", borderRadius: 14, overflow: "hidden",
                  position: "relative", padding: 0, cursor: "pointer",
                  border: selIdx >= 0 ? "2px solid var(--lime)" : "1px solid var(--line-1)",
                  background: "var(--bg-2)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.url && <img src={p.url} alt={fmtDate(p.taken_at)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                <span style={{
                  position: "absolute", left: 0, right: 0, bottom: 0,
                  padding: "12px 6px 4px", textAlign: "left",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
                  fontFamily: mono, fontSize: 9, color: "#fff", letterSpacing: "0.02em",
                }}>
                  {fmtDate(p.taken_at)}{p.weight_kg != null ? ` · ${p.weight_kg}kg` : ""}
                </span>
                {selIdx >= 0 && (
                  <span style={{
                    position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9,
                    background: "var(--lime)", color: "#0a0d15", fontSize: 10, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono,
                  }}>
                    {selIdx + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!loading && visible.length === 0 && !compareMode && (
          <div style={{ fontSize: 11.5, color: "var(--text-3)", fontFamily: mono, marginTop: 10, lineHeight: 1.5 }}>
            Sacate una foto cada tanto para ver tu avance real, más allá de la balanza.
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPick} style={{ display: "none" }} />

      {/* ── Sheet: metadata de la nueva foto ── */}
      <Sheet open={!!pendingFile} onClose={closeUpload} height="auto">
        <div style={{ padding: "8px 20px 28px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-1)", marginBottom: 14 }}>
            Nueva foto de progreso
          </div>
          {pendingPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pendingPreview} alt="preview" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 16, marginBottom: 16 }} />
          )}
          <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: mono, fontWeight: 600 }}>Peso (opcional)</label>
          <input
            type="number" inputMode="decimal" value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder={defaultWeight != null ? String(defaultWeight) : "73.4"} step="0.1" min="1"
            style={inputStyle}
          />
          <label style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: mono, fontWeight: 600, marginTop: 12, display: "block" }}>Nota (opcional)</label>
          <input
            type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
            placeholder="post vacaciones, semana de descarga…" maxLength={120}
            style={inputStyle}
          />
          <button
            onClick={confirmUpload} disabled={uploading}
            className="kilo-pressable"
            style={{
              width: "100%", marginTop: 20, padding: "13px",
              background: "var(--lime)", border: "none", borderRadius: 14,
              color: "#0a0d15", fontSize: 14, fontWeight: 700, fontFamily: mono,
              letterSpacing: "0.03em", cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? "GUARDANDO…" : "GUARDAR FOTO"}
          </button>
        </div>
      </Sheet>

      {/* ── Detalle de una foto ── */}
      {viewing && (
        <Overlay onClose={() => setViewing(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {viewing.url && <img src={viewing.url} alt="" style={{ width: "100%", borderRadius: 18, maxHeight: "60vh", objectFit: "contain" }} />}
          <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text-1)" }}>{fmtDate(viewing.taken_at)}</span>
            {viewing.weight_kg != null && <span style={{ fontFamily: mono, fontSize: 15, color: "var(--lime)", fontWeight: 600 }}>{viewing.weight_kg} kg</span>}
          </div>
          {viewing.note && <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{viewing.note}</div>}
          <button
            onClick={() => { remove(viewing.id); setViewing(null); }}
            style={{
              marginTop: 22, width: "100%", padding: "12px",
              background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.2)",
              borderRadius: 14, color: "var(--red)", fontSize: 12.5, fontWeight: 600,
              fontFamily: "var(--font-body)", cursor: "pointer",
            }}
          >
            Eliminar foto
          </button>
        </Overlay>
      )}

      {/* ── Comparación antes/después ── */}
      {compareMode && compareA && compareB && (
        <Overlay onClose={exitCompare}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[compareA, compareB].map((p, i) => (
              <div key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.url && <img src={p.url} alt="" style={{ width: "100%", aspectRatio: "3 / 4", objectFit: "cover", borderRadius: 14 }} />}
                <div style={{ marginTop: 6, fontFamily: mono, fontSize: 11, color: "var(--text-3)" }}>{i === 0 ? "ANTES" : "DESPUÉS"}</div>
                <div style={{ fontFamily: mono, fontSize: 12.5, color: "var(--text-1)" }}>{fmtDate(p.taken_at)}</div>
                {p.weight_kg != null && <div style={{ fontFamily: mono, fontSize: 12.5, color: "var(--lime)", fontWeight: 600 }}>{p.weight_kg} kg</div>}
              </div>
            ))}
          </div>
          <CompareDelta a={compareA} b={compareB} />
        </Overlay>
      )}
    </>
  );
}

function CompareDelta({ a, b }: { a: ProgressPhoto; b: ProgressPhoto }) {
  const days = daysBetween(a.taken_at, b.taken_at);
  const kgDiff = a.weight_kg != null && b.weight_kg != null
    ? Math.round((b.weight_kg - a.weight_kg) * 10) / 10
    : null;
  return (
    <div style={{
      marginTop: 16, padding: "12px 16px", textAlign: "center",
      background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 14,
      fontFamily: mono, fontSize: 13, color: "var(--text-1)",
    }}>
      {kgDiff != null && (
        <span style={{ color: kgDiff < 0 ? "var(--lime)" : "var(--orange)", fontWeight: 700, fontSize: 16 }}>
          {kgDiff < 0 ? "↓" : kgDiff > 0 ? "↑" : ""}{Math.abs(kgDiff)} kg{" "}
        </span>
      )}
      <span style={{ color: "var(--text-3)" }}>en {days} {days === 1 ? "día" : "días"}</span>
    </div>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 70,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360 }}>
        <button
          onClick={onClose}
          style={{
            marginLeft: "auto", marginBottom: 12, display: "flex",
            width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
            background: "var(--bg-1)", border: "1px solid var(--line-1)", cursor: "pointer",
          }}
        >
          <IconClose size={16} color="var(--text-2)" />
        </button>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", marginTop: 6, background: "var(--bg-2)",
  border: "1px solid var(--line-2)", borderRadius: 10, color: "var(--text-1)",
  fontFamily: mono, fontSize: 15, padding: "10px 12px", outline: "none", boxSizing: "border-box",
};
