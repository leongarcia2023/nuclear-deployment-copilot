"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Deal Diligence", href: "/", match: ["/"] },
  { label: "Source Library", href: "/corpus", match: ["/corpus"] },
  { label: "Methodology", href: "/methodology", match: ["/methodology", "/about"] },
];

function isActive(pathname: string, matches: string[]) {
  return matches.some((match) => pathname === match || (match !== "/" && pathname.startsWith(`${match}/`)));
}

export function SiteNav({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";

  return (
    <nav className={`border-b border-[#d9d3c8] bg-[#f4f1ea] px-5 py-4 sm:px-8 ${className}`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <Link className="text-base font-semibold text-[#151514]" href="/">Nuclear Deployment Intelligence</Link>
        <div className="flex flex-wrap items-center gap-2 text-base text-[#63615b] sm:gap-3">
          {navItems.map((item) => {
            const active = isActive(pathname, item.match);
            return (
              <Link
                key={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2 font-semibold transition-colors ${
                  active ? "bg-[#151514] text-white" : "text-[#4a4842] hover:bg-[#e8e1d5] hover:text-[#151514]"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
