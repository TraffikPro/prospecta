import Link from "next/link";

/** Synthetic fixture: next/no-html-link-for-pages (uses get-root-dirs / fast-glob). */
export function BadHtmlLink() {
  return (
    <a href="/app/leads">
      Leads via raw anchor
    </a>
  );
}

export function GoodNextLink() {
  return <Link href="/app/leads">Leads</Link>;
}
