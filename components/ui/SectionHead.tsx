interface SectionHeadProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHead({ title, action, onAction }: SectionHeadProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "24px 20px 12px",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 17,
          letterSpacing: "-0.02em",
          color: "var(--text-1)",
          margin: 0,
        }}
      >
        {title}
      </h3>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--lime)",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "var(--font-body)",
            display: "flex",
            alignItems: "center",
            gap: 2,
            whiteSpace: "nowrap",
            padding: 0,
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
