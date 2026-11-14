import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Tabs from "../components/Tabs";
import SitePreview from "../components/SitePreview";
import { buildDoc, CATEGORIES, TEMPLATES } from "../data/templates";

const TABS = ["All", ...CATEGORIES] as const;
type Tab = (typeof TABS)[number];

export default function Templates() {
  const [tab, setTab] = useState<Tab>("All");

  const list = useMemo(
    () => (tab === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === tab)),
    [tab],
  );
  const docs = useMemo(() => new Map(TEMPLATES.map((t) => [t.id, buildDoc(t)])), []);

  return (
    <>
      <PageHeader
        title="Website Templates"
        subtitle="Professional author websites, ready for your books. Pick one, then click any text or image to make it yours."
      />

      <div className="mb-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <li key={t.id}>
            <Link
              to={`/templates/${t.id}`}
              className="group block overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-xl focus-visible:border-brand focus-visible:outline-none"
            >
              <div className="relative">
                <SitePreview doc={docs.get(t.id)!} className="aspect-[4/3] border-b border-line" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/35">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black opacity-0 shadow-lg transition group-hover:opacity-100">
                    Use this template <ArrowUpRight size={14} />
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <h2 className="font-serif text-lg font-bold text-ink">{t.name}</h2>
                <p className="text-xs text-muted">{t.category}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
