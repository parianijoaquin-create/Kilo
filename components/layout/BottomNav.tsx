"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconBook,
  IconTarget,
  IconSpark,
  IconUser,
} from "@/components/icons";

const NAV_ITEMS = [
  { id: "dashboard", href: "/dashboard", label: "Inicio",  Icon: IconHome   },
  { id: "diary",     href: "/diary",     label: "Diario",  Icon: IconBook   },
  { id: "macros",    href: "/macros",    label: "Macros",  Icon: IconTarget },
  { id: "habits",    href: "/habits",    label: "Hábitos", Icon: IconSpark  },
  { id: "profile",   href: "/profile",   label: "Perfil",  Icon: IconUser   },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 390,
        paddingBottom: 24,
        paddingTop: 8,
        background: "linear-gradient(to top, var(--bg-0) 0%, var(--bg-0) 60%, transparent)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 50,
        borderTop: "0.5px solid var(--line-1)",
      }}
    >
      {NAV_ITEMS.map(({ id, href, label, Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={id}
            href={href}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 12px",
              cursor: "pointer",
              color: isActive ? "var(--lime)" : "var(--text-3)",
              transition: "color var(--motion-state)",
              fontFamily: "var(--font-body)",
              position: "relative",
              textDecoration: "none",
              minWidth: 44,
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2 : 1.6} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.01em" }}>
              {label}
            </span>
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "var(--lime)",
                  boxShadow: "0 0 8px var(--lime)",
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
