import Link from "next/link";

const spaces = [
  { href: "/feed", number: "01", title: "Fil d’actualité", description: "Les publications, les idées et les personnes que vous suivez." },
  { href: "/immersive", number: "02", title: "Expérience immersive", description: "Découvrez les contenus dans une expérience pensée pour le mobile." },
  { href: "/messages", number: "03", title: "Messages", description: "Retrouvez vos conversations privées dans un espace dédié." },
  { href: "/notifications", number: "04", title: "Notifications", description: "Suivez les interactions importantes de votre réseau." },
  { href: "/cloud", number: "05", title: "DCloud Vault", description: "Organisez vos fichiers personnels et vos médias." },
  { href: "/admin", number: "06", title: "Administration", description: "Gérez les outils et les contrôles réservés aux responsables." },
];

export default function HomePage() {
  return <main className="landing-shell"><header className="landing-header"><Link href="/" className="brand-mark" aria-label="DJANVUƐ accueil"><span className="brand-symbol">Ɛ</span><span>DJANVU<span className="brand-e">Ɛ</span></span></Link><span className="header-caption">UN UNIVERS. PLUSIEURS POSSIBILITÉS.</span></header><section className="landing-hero"><p className="eyebrow">BIENVENUE DANS VOTRE UNIVERS</p><h1>Votre monde social,<br/><span>sans frontières.</span></h1><p className="hero-copy">Publiez vos idées, retrouvez vos communautés, échangez et créez. DJANVUƐ rassemble vos expériences dans un même espace.</p><div className="hero-actions"><Link className="primary-action" href="/feed">Entrer dans DJANVUƐ <span aria-hidden>↗</span></Link><span className="hero-note">Une expérience en évolution</span></div><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-orbit orbit-three"/></section><section className="spaces-section" aria-labelledby="spaces-heading"><div className="section-heading"><div><p className="eyebrow">EXPLOREZ LA PLATEFORME</p><h2 id="spaces-heading">Un espace pour chaque facette de vous.</h2></div><span className="section-count">06 ESPACES</span></div><div className="spaces-grid">{spaces.map(space=><Link href={space.href} className="space-card" key={space.number}><span className="space-number">{space.number}</span><span className="space-arrow" aria-hidden>↗</span><h3>{space.title}</h3><p>{space.description}</p></Link>)}</div></section><footer className="landing-footer"><span>© {new Date().getFullYear()} DJANVUƐ</span><span>Conçu pour connecter les univers.</span></footer></main>;
}
