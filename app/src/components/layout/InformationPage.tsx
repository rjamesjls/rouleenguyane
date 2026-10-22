import Link from 'next/link';
export default function InformationPage({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="page"><section className="section container" style={{ maxWidth: 840 }}><h1 style={{ marginBottom: 24 }}>{title}</h1><div style={{ display: 'grid', gap: 24, lineHeight: 1.8 }}>{children}<Link href="/catalogue" className="btn btn-primary">Parcourir les véhicules</Link></div></section></div>;
}
