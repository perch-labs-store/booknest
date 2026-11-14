import { useEffect, useState } from "react";
import { BadgeCheck, Clock } from "lucide-react";
import { loadMyVerification, requestVerification, type VerificationStatus } from "../data/remote";

interface Props {
  verified: boolean;
  authorId: string | null;
  publishedCount: number;
}

/** Settings card: shows verified state, or lets an author ask for the badge. Approval is done in the Supabase dashboard. */
export default function VerificationCard({ verified, authorId, publishedCount }: Props) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadMyVerification().then(setStatus); }, []);

  const submit = async () => {
    if (!authorId) return;
    setBusy(true);
    setError(null);
    try {
      await requestVerification(authorId, note);
      setStatus("pending");
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send your request.");
    } finally {
      setBusy(false);
    }
  };

  let body: JSX.Element;
  if (verified) {
    body = <p className="flex items-center gap-2 text-sm text-ink"><BadgeCheck size={18} className="text-info" /> You're a verified author. The badge shows next to your name.</p>;
  } else if (status === null) {
    body = <p className="text-sm text-muted">Loading…</p>;
  } else if (status === "pending") {
    body = <p className="flex items-center gap-2 text-sm text-ink"><Clock size={16} className="text-accent" /> Your request is waiting for review. We'll notify you when it's decided.</p>;
  } else if (publishedCount === 0) {
    body = <p className="text-sm text-muted">Publish at least one book first. Then you can ask to be verified.</p>;
  } else {
    body = (
      <div>
        {status === "rejected" && <p className="mb-3 rounded-lg border border-line bg-bg px-3 py-2 text-xs text-muted">Your last request wasn't approved. You can add more detail and ask again.</p>}
        <label htmlFor="verify-note" className="mb-1.5 block text-xs font-semibold text-ink">Anything that proves who you are <span className="font-normal text-muted">(optional)</span></label>
        <textarea
          id="verify-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Link to your website or social account, a publisher page, press coverage…"
          className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none"
        />
        {error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}
        <button type="button" onClick={submit} disabled={busy || !authorId} className="mt-3 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-[#14181F] hover:brightness-110 disabled:opacity-60">
          {busy ? "Sending…" : "Request verification"}
        </button>
      </div>
    );
  }

  return (
    <section
      className="mb-4 max-w-2xl rounded-2xl p-px"
      style={{ background: "linear-gradient(135deg, #F472B6, #DDB77E)" }}
    >
      <div className="rounded-[15px] bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-ink">{verified ? "You're verified" : "Become verified"}</h3>
            <p className="mt-0.5 text-sm text-muted">{verified ? "The blue tick shows next to your name." : "Get the blue tick on your author page"}</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-info"><BadgeCheck size={22} /></span>
        </div>
        {body}
      </div>
    </section>
  );
}
