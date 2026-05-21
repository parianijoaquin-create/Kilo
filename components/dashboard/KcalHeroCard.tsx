"use client";

import { Ring } from "@/components/ui/Ring";
import { Stat } from "@/components/ui/Stat";
import { fmtNum } from "@/lib/format";

interface KcalHeroCardProps {
  kcalLogged: number;
  kcalGoal: number;
  onClick?: () => void;
}

export function KcalHeroCard({ kcalLogged, kcalGoal, onClick }: KcalHeroCardProps) {
  const remaining = kcalGoal - kcalLogged;
  const consumedPct = Math.round((kcalLogged / kcalGoal) * 100);

  return (
    <div
      onClick={onClick}
      className="kilo-pressable"
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--line-1)",
        borderRadius: 22,
        padding: 22,
        overflow: "hidden",
        position: "relative",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {/* glow blob */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -60,
          width: 220,
          height: 220,
          background: "radial-gradient(circle, rgba(198,255,80,0.22) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div>
          <div style={{
            fontSize: 10.5,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--text-3)",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
          }}>
            RESTANTES HOY
          </div>
          <div style={{ marginTop: 6 }}>
            <Stat value={fmtNum(remaining)} unit="kcal" size={54} color="var(--lime)" />
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
            {fmtNum(kcalLogged)} / {fmtNum(kcalGoal)} consumidas
          </div>
        </div>

        <Ring size={92} stroke={10} value={kcalLogged} max={kcalGoal} color="var(--lime)">
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 500,
            color: "var(--text-1)",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}>
            {consumedPct}
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>%</span>
          </div>
        </Ring>
      </div>

      {/* status bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 18,
        padding: "8px 12px",
        background: "rgba(198,255,80,0.06)",
        border: "0.5px solid rgba(198,255,80,0.18)",
        borderRadius: 12,
      }}>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--lime)",
          boxShadow: "0 0 6px var(--lime)",
        }} />
        <span style={{ fontSize: 11.5, color: "var(--text-2)", flex: 1 }}>
          Vas bien encaminado. Quedan{" "}
          <strong style={{ color: "var(--text-1)" }}>2 comidas</strong> por registrar.
        </span>
      </div>
    </div>
  );
}
