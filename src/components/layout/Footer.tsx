export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line/60 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-ink-dim sm:flex-row sm:px-6 lg:px-8">
        <div>
          © {new Date().getFullYear()} Spark DEX • Built on{" "}
          <a className="text-grad font-semibold" href="https://www.pharos.xyz" target="_blank" rel="noreferrer">Pharos</a>
        </div>
        <div className="flex items-center gap-5">
          <a href="https://pharosscan.xyz" className="hover:text-ink" target="_blank" rel="noreferrer">Explorer</a>
          <a href="https://docs.pharos.xyz" className="hover:text-ink" target="_blank" rel="noreferrer">Docs</a>
          <a href="https://twitter.com" className="hover:text-ink" target="_blank" rel="noreferrer">X</a>
        </div>
      </div>
    </footer>
  );
}
