"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useSheet } from "@/context/SheetContext";
import { IconSearch, IconCamera, IconBarcode, IconClose } from "@/components/icons";
import { KILO_DATA } from "@/data/mock";
import type { MockFood } from "@/types";

const TABS = ["Frecuentes", "Recientes", "Mis recetas"] as const;
type Tab = (typeof TABS)[number];

function MacroBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 9.5,
      color: "var(--text-2)",
    }}>
      <span style={{ color, fontWeight: 700 }}>{label}</span> {value}g
    </span>
  );
}

function FoodRow({ food, onAdd }: { food: MockFood; onAdd: (food: MockFood) => void }) {
  return (
    <button
      className="kilo-pressable"
      onClick={() => onAdd(food)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 20px",
        width: "100%",
        background: "none",
        border: "none",
        borderBottom: "0.5px solid var(--line-1)",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{food.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5,
          fontWeight: 500,
          color: "var(--text-1)",
          letterSpacing: "-0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {food.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
          {food.meta}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <MacroBadge label="P" value={food.p} color="var(--lime)" />
          <MacroBadge label="C" value={food.c} color="var(--blue)" />
          <MacroBadge label="G" value={food.f} color="var(--orange)" />
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 500,
          color: "var(--lime)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          {food.kcal}
        </div>
        <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
          kcal
        </div>
      </div>
    </button>
  );
}

export function AddFoodSheet() {
  const { isOpen, mealId, closeSheet } = useSheet();
  const [activeTab, setActiveTab] = useState<Tab>("Frecuentes");
  const [query, setQuery] = useState("");

  const foods = KILO_DATA.frequentFoods.filter((f) =>
    !query || f.name.toLowerCase().includes(query.toLowerCase())
  );

  function handleAdd(food: MockFood) {
    console.log("Add food", food.id, "to meal", mealId);
    closeSheet();
  }

  return (
    <Sheet open={isOpen} onClose={closeSheet} height="82%">
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 20px 0",
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--text-1)",
        }}>
          {mealId ? `Agregar a ${mealId}` : "Agregar alimento"}
        </div>
        <button
          className="kilo-pressable"
          onClick={closeSheet}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "var(--bg-2)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconClose size={16} color="var(--text-2)" />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "12px 20px 0", flexShrink: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: 14,
          padding: "0 14px",
          height: 44,
        }}>
          <IconSearch size={16} color="var(--text-3)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alimento, marca…"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "var(--text-1)",
              fontFamily: "var(--font-body)",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
            >
              <IconClose size={14} color="var(--text-3)" />
            </button>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: "10px 20px 0", display: "flex", gap: 8, flexShrink: 0 }}>
        {[
          { Icon: IconBarcode, label: "Código de barras", color: "var(--blue)" },
          { Icon: IconCamera,  label: "Foto",             color: "var(--orange)" },
        ].map(({ Icon, label, color }) => (
          <button
            key={label}
            className="kilo-pressable"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "9px 0",
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: 12,
              cursor: "pointer",
              fontSize: 11.5,
              color: "var(--text-2)",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
            }}
          >
            <Icon size={15} color={color} />
            {label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        padding: "12px 20px 0",
        display: "flex",
        gap: 4,
        flexShrink: 0,
        borderBottom: "0.5px solid var(--line-1)",
        paddingBottom: 0,
      }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 12px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--lime)" : "2px solid transparent",
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "var(--lime)" : "var(--text-3)",
              fontFamily: "var(--font-body)",
              transition: "color var(--motion-state), border-color var(--motion-state)",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Food list */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}>
        {foods.length > 0 ? (
          foods.map((food) => (
            <FoodRow key={food.id} food={food} onAdd={handleAdd} />
          ))
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            gap: 8,
          }}>
            <div style={{ fontSize: 36 }}>🔍</div>
            <div style={{ fontSize: 13.5, color: "var(--text-3)", textAlign: "center" }}>
              No encontramos &ldquo;{query}&rdquo;
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", opacity: 0.6 }}>
              Probá otro nombre o escanéalo
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
