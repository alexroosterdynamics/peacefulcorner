// components/Footer.js
export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-zinc-400">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Peaceful Corner • Iași</p>
          <p className="text-zinc-500">Strada Sărăriei 202, etaj 5 • 50 sqm • Balcony</p>
        </div>
      </div>
    </footer>
  );
}
