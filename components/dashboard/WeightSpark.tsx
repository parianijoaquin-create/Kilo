interface WeightSparkProps {
  data: number[];
}

export function WeightSpark({ data }: WeightSparkProps) {
  if (data.length < 2) {
    return <div style={{ height: 24, opacity: 0.2, background: "var(--line-1)", borderRadius: 4 }} />;
  }
  const min = Math.min(...data) - 0.2;
  const max = Math.max(...data) + 0.2;
  const W = 140;
  const H = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * H;
    return [x, y] as [number, number];
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const last = pts[pts.length - 1];

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="ws-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--lime)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--lime)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${d} L${W},${H} L0,${H} Z`} fill="url(#ws-grad)" />
      <path
        d={d}
        fill="none"
        stroke="var(--lime)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--lime)" />
    </svg>
  );
}
