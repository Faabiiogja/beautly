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
    <nav className="flex gap-1 overflow-x-auto">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-brand-50 text-brand-700"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
