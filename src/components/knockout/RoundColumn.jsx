export default function RoundColumn({ title, children }) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-fifa-gold">{title}</p>
      </div>
      {children}
    </section>
  )
}
