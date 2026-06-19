"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Início" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/services", label: "Serviços" },
  { href: "/admin/business/hours", label: "Horários" },
  { href: "/admin/business", label: "Negócio" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              active
                ? "gradient-brand text-white shadow-[0_8px_18px_-8px_rgba(236,72,153,0.6)]"
                : "text-ink-500 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
