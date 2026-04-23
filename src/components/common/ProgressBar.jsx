export default function ProgressBar({ value }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-fifa-blue to-fifa-gold transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
