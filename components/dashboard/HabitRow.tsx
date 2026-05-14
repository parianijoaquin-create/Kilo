import type { ComponentType } from "react";
import { Bar } from "@/components/ui/Bar";
import { IconFlame, IconCheck } from "@/components/icons";

interface HabitRowProps {
  Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  name: string;
  sub: string;
  streak: number;
  done: boolean;
  color: string;
  progress?: number;
  onClick?: () => void;
}

export function HabitRow({ Icon, name, sub, streak, done, color, progress, onClick }: HabitRowProps) {
  return (
    <div
      onClick={onClick}
      className="kilo-pressable"
      style={{
        background: done ? "rgba(198,255,80,0.04)" : "var(--bg-1)",
        border: `1px solid ${done ? "rgba(198,255,80,0.2)" : "var(--line-1)"}`,
        borderRadius: 16,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 11,
        background: `${color}1c`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Icon size={18} color={color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 14.5,
          fontWeight: 500,
          letterSpacing: "-0.015em",
          color: "var(--text-1)",
        }}>
          {name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{sub}</div>
        {progress !== undefined && (
          <div style={{ marginTop: 6 }}>
            <Bar value={progress} max={1} color={color} height={3} />
          </div>
        )}
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        background: done ? "rgba(198,255,80,0.12)" : "var(--bg-2)",
        borderRadius: 100,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 600,
        color: done ? "var(--lime)" : "var(--text-2)",
      }}>
        <IconFlame size={11} color={done ? "var(--lime)" : "var(--text-2)"} />
        {streak}
      </div>

      <div style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: done ? "var(--lime)" : "transparent",
        border: done ? "1.5px solid var(--lime)" : "1.5px solid var(--line-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {done && <IconCheck size={14} color="#0a0d15" strokeWidth={2.5} />}
      </div>
    </div>
  );
}
