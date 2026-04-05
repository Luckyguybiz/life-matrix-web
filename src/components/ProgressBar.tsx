export default function ProgressBar({
  progress,
  color,
  showLabel = true,
}: {
  progress: number;
  color: string;
  showLabel?: boolean;
}) {
  const val = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${val}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-zinc-500 w-9 text-right">
          {Math.round(val)}%
        </span>
      )}
    </div>
  );
}
