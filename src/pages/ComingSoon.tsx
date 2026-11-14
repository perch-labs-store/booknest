import { Hourglass } from "lucide-react";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-5 rounded-full border border-line bg-surface p-5 text-accent">
        <Hourglass size={32} />
      </div>
      <h1 className="font-serif text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-muted">Coming soon</p>
    </div>
  );
}
