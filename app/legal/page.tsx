'use client';
import { useEffect, useState } from 'react';
import { ExternalLink, History, RotateCcw, Scale, Send } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import {
  getLegalDocument,
  getLegalDocumentVersion,
  LEGAL_PAGES,
  listLegalDocuments,
  previewLegalDocument,
  publicLegalUrl,
  publishLegalDocument,
  type LegalSlug,
} from '@/lib/api/legal';
import { dateTime } from '@/lib/format';
import { Badge, Button, Canvas, Failed, Loading, PageHead, Panel } from '@/components/ui/primitives';
import { Field, FormError, TextArea, TextInput } from '@/components/ui/Form';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

/** Styles for the server-rendered preview (the same tags the public page uses). */
const PREVIEW =
  'text-[14px] leading-relaxed text-[#475569] [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-[#1E293B] [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:font-bold [&_h3]:text-[#1E293B] [&_p]:my-2.5 [&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_a]:font-semibold [&_a]:text-[#635BFF] [&_strong]:text-[#1E293B] [&_code]:rounded [&_code]:bg-[#EEF2FF] [&_code]:px-1 [&_.note]:my-3 [&_.note]:rounded-lg [&_.note]:border [&_.note]:border-[#C7D2FE] [&_.note]:bg-[#EEF2FF] [&_.note]:px-3.5 [&_.note]:py-2.5';

export default function LegalPagesPage() {
  const [slug, setSlug] = useState<LegalSlug>('privacy-policy');
  const summaries = useApi(() => listLegalDocuments(), [], 'legal-documents');
  const detail = useApi(() => getLegalDocument(slug), [slug], 'legal-document');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loadedFrom, setLoadedFrom] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const publish = useMutation(publishLegalDocument);
  const loadVersion = useMutation(getLegalDocumentVersion);

  const doc = detail.data;
  // The editor starts from the live text of the page it shows. A background refresh (window focus)
  // must not wipe a draft, so it only reloads when switching pages or when nothing was changed.
  const [base, setBase] = useState<{ slug: string; version: number; title: string; content: string } | null>(null);
  const dirty = !!base && (title !== base.title || content !== base.content);
  if (doc && (!base || base.slug !== doc.slug || (base.version !== doc.version && !dirty))) {
    setBase({ slug: doc.slug, version: doc.version, title: doc.title, content: doc.content });
    setTitle(doc.title);
    setContent(doc.content);
    setLoadedFrom(null);
  }
  const overtaken = !!doc && !!base && base.slug === doc.slug && base.version !== doc.version;

  // The preview is rendered by the API, exactly as the public page will be.
  useEffect(() => {
    if (!content.trim()) return;
    let current = true;
    const timer = setTimeout(() => {
      previewLegalDocument(content)
        .then((r) => current && setPreviewHtml(r.html))
        .catch(() => undefined);
    }, 400);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [content]);

  async function confirmPublish() {
    const saved = await publish.mutate(slug, { title: title.trim(), content: content.trim() });
    if (saved) {
      setConfirmOpen(false);
      setBase(null);
      detail.setData(saved);
      await summaries.refresh();
    }
  }

  async function openVersion(version: number) {
    const old = await loadVersion.mutate(slug, version);
    if (old) {
      setTitle(old.title);
      setContent(old.content);
      setLoadedFrom(`version ${old.version} (${dateTime(old.publishedAt)})`);
    }
  }

  function discard() {
    setBase(null); // reloads the editor from the live text
  }

  const summary = (s: LegalSlug) => summaries.data?.find((d) => d.slug === s);

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Legal pages"
        lede="The privacy policy, terms and account-deletion page that the website, both apps and the Google Play listings show. Publishing updates them everywhere at once; every published version is kept."
        actions={
          <a href={publicLegalUrl(slug)} target="_blank" rel="noreferrer">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4" /> Open live page
            </Button>
          </a>
        }
      />
      <Canvas>
        <div className="flex flex-wrap gap-2">
          {LEGAL_PAGES.map((p) => {
            const s = summary(p.slug);
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => setSlug(p.slug)}
                className={`rounded-lg border px-4 py-2.5 text-left font-manrope transition-colors ${
                  slug === p.slug ? 'border-[#635BFF] bg-[#EEF2FF]' : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                }`}
              >
                <span className="flex items-center gap-2 text-[13px] font-bold text-[#1E293B]">
                  <Scale className="h-4 w-4 text-[#635BFF]" /> {p.label}
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-[#94A3B8]">
                  {s ? (s.isDefault ? 'Built-in text (not yet published)' : `v${s.version} · ${dateTime(s.publishedAt)}`) : '…'}
                </span>
              </button>
            );
          })}
        </div>

        {detail.loading && !doc ? (
          <Loading label="Loading the page" />
        ) : detail.error ? (
          <Failed message={detail.error} onRetry={detail.refresh} />
        ) : doc ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel
              title="Edit"
              note={LEGAL_PAGES.find((p) => p.slug === slug)?.hint}
              actions={
                <div className="flex items-center gap-2">
                  {dirty && <Badge tone="warning">Unpublished changes</Badge>}
                  {doc.isDefault ? <Badge tone="plain">Built-in text</Badge> : <Badge tone="live">Live v{doc.version}</Badge>}
                </div>
              }
            >
              <div className="space-y-4">
                {overtaken && (
                  <p className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] font-semibold text-[#B91C1C]">
                    Another admin published version {doc.version} while you were editing. Publishing now replaces it with your text; discard to load theirs.
                  </p>
                )}
                {loadedFrom && (
                  <p className="rounded-lg border border-[#FEF08A] bg-[#FEF9C3] px-3 py-2 text-[12px] font-semibold text-[#B45309]">
                    Showing {loadedFrom}. Publish it to make it live again, or discard to go back.
                  </p>
                )}
                <Field label="Title">
                  <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
                </Field>
                <Field
                  label="Text"
                  hint="## Heading · ### Smaller heading · - bullet · > highlighted note · **bold** · [link text](https://…). A blank line starts a new paragraph."
                >
                  <TextArea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={26}
                    maxLength={60000}
                    spellCheck
                    className="font-mono! text-[12.5px]! leading-relaxed"
                  />
                </Field>
                <FormError message={publish.error || loadVersion.error} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" disabled={!dirty || !title.trim() || content.trim().length < 50} onClick={() => setConfirmOpen(true)}>
                    <Send className="h-4 w-4" /> Publish
                  </Button>
                  <Button variant="outline" disabled={!dirty} onClick={discard}>
                    <RotateCcw className="h-4 w-4" /> Discard changes
                  </Button>
                </div>
              </div>
            </Panel>

            <div className="space-y-5">
              <Panel title="Preview" note="Exactly as the public page will show it">
                <h1 className="font-manrope text-[24px] font-extrabold text-[#1E293B]">{title || 'Untitled'}</h1>
                {/* Rendered and escaped by the API (legal-markdown.ts): only a fixed set of tags. */}
                <div className={PREVIEW} dangerouslySetInnerHTML={{ __html: content.trim() ? previewHtml : '' }} />
              </Panel>

              <Panel title="Published versions" note={doc.versions.length ? undefined : 'Nothing published yet: the built-in text is live.'}>
                {doc.versions.length === 0 ? (
                  <p className="text-[13px] text-[#94A3B8]">Publish once to start the history.</p>
                ) : (
                  <ul className="divide-y divide-[#F1F5F9]">
                    {doc.versions.map((v) => (
                      <li key={v.version} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-[13px]">
                        <span className="flex items-center gap-2">
                          <History className="h-4 w-4 text-[#94A3B8]" />
                          <strong className="text-[#1E293B]">v{v.version}</strong>
                          <span className="text-[#64748B]">{dateTime(v.publishedAt)}</span>
                          {v.publishedBy && <span className="text-[#94A3B8]">by {v.publishedBy}</span>}
                          {v.version === doc.version && <Badge tone="live">Live</Badge>}
                        </span>
                        {v.version !== doc.version && (
                          <Button variant="outline" disabled={loadVersion.pending} onClick={() => openVersion(v.version)}>
                            Load into editor
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        ) : null}
      </Canvas>

      <ConfirmDialog
        open={confirmOpen}
        title={`Publish the ${LEGAL_PAGES.find((p) => p.slug === slug)?.label}?`}
        description="It goes live straight away on the website, in both apps and on the Google Play links, and becomes a new version in the history. For important changes, also tell users in the app."
        confirmLabel="Publish now"
        variant="primary"
        pending={publish.pending}
        error={publish.error}
        onConfirm={confirmPublish}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
