import Link from "next/link";
import { APP_NAME } from "@/lib/site";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M16 2 C10 10 6 15 6 20 a10 10 0 0 0 20 0 C26 15 22 10 16 2Z" fill="#f59e0b" />
      <path d="M16 2 C13 7 11 10 10.5 13" stroke="#fde68a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="21" r="5.5" fill="#fffbeb" />
      <text x="16" y="24.5" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" textAnchor="middle" fill="#b45309">
        $
      </text>
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold tracking-tight">
      <LogoMark />
      <span>{APP_NAME}</span>
    </Link>
  );
}
