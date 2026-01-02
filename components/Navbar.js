// components/Navbar.js
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/75 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="#top" className="font-semibold tracking-tight">
          Peaceful Corner
        </Link>
        <nav className="hidden gap-6 text-sm text-zinc-200 sm:flex">
          <Link href="#gallery" className="hover:text-white">Gallery</Link>
          <Link href="#availability" className="hover:text-white">Calendar</Link>
          <Link href="#hosts" className="hover:text-white">Hosts</Link>
          <Link href="#contact" className="hover:text-white">Contact</Link>
        </nav>
        <Link
          href="#availability"
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
        >
          Check dates
        </Link>
      </div>
    </header>
  );
}
