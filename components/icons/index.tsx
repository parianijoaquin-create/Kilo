import type { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function Icon({
  children,
  size = 24,
  color = "currentColor",
  strokeWidth = 1.6,
  fill = "none",
  style,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconHome(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />
    </Icon>
  );
}

export function IconBook(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z" />
      <path d="M4 4.5v18" />
      <path d="M8 7h8M8 11h6" />
    </Icon>
  );
}

export function IconTarget(p: IconProps) {
  const c = p.color ?? "currentColor";
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill={c} />
    </Icon>
  );
}

export function IconSpark(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </Icon>
  );
}

export function IconUser(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </Icon>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}

export function IconChevronLeft(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M15 6l-6 6 6 6" />
    </Icon>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5 12l5 5L20 7" />
    </Icon>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Icon>
  );
}

export function IconCamera(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="4" />
    </Icon>
  );
}

export function IconBarcode(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 6v12M7 6v12M10 6v8M13 6v12M16 6v8M19 6v12" />
    </Icon>
  );
}

export function IconFlame(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C10 8 9 6 12 3z" />
      <path
        d="M12 21c4 0 7-3 7-7 0-2-1-4-2-5 0 3-2 5-4 5-1 0-2-1-2-2 0 3-2 5-4 5 0 3 2 4 5 4z"
        opacity={0.4}
      />
    </Icon>
  );
}

export function IconDroplet(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3c0 0-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />
    </Icon>
  );
}

export function IconMoon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </Icon>
  );
}

export function IconPill(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)" />
      <path d="M8.7 7.3l4 6.9" transform="rotate(-30 12 12)" />
    </Icon>
  );
}

export function IconActivity(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 12h3l3-8 4 16 3-8h5" />
    </Icon>
  );
}

export function IconTrend(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 17l6-6 4 4 8-9" />
      <path d="M14 6h7v7" />
    </Icon>
  );
}

export function IconArrowUp(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </Icon>
  );
}

export function IconArrowDown(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </Icon>
  );
}

export function IconClose(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function IconBell(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </Icon>
  );
}

export function IconSettings(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Icon>
  );
}

export function IconClock(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}

export function IconScale(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M12 10v3M9 13h6" />
      <path d="M8 7h8" />
    </Icon>
  );
}

export function IconLeaf(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 21c0-10 7-17 18-17-1 11-7 17-17 17z" />
      <path d="M3 21c4-4 9-7 14-9" />
    </Icon>
  );
}

export function IconChart(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 21h18" />
      <rect x="6" y="11" width="3" height="8" />
      <rect x="11" y="6" width="3" height="13" />
      <rect x="16" y="14" width="3" height="5" />
    </Icon>
  );
}

export function IconDots(p: IconProps) {
  const c = p.color ?? "currentColor";
  return (
    <Icon {...p}>
      <circle cx="6" cy="12" r="1.4" fill={c} />
      <circle cx="12" cy="12" r="1.4" fill={c} />
      <circle cx="18" cy="12" r="1.4" fill={c} />
    </Icon>
  );
}

export function IconEdit(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 20h4l11-11-4-4L4 16z" />
      <path d="M14 5l4 4" />
    </Icon>
  );
}

export function IconRunner(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="13" cy="4.5" r="1.5" />
      <path d="M6 21l3-5 3-3-2-3 4-3 2 3 3 1" />
      <path d="M9 16l-2 5M14 14l3 3 2 4" />
    </Icon>
  );
}
