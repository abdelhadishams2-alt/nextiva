import { affiliatePartners } from '@/config/affiliates';

interface AffiliateSidebarProps {
  partner: string;
  variant?: string;
  label?: string;
  title?: string;
  buttonText?: string;
}

export default function AffiliateSidebar({ partner, variant, label, title, buttonText }: AffiliateSidebarProps) {
  const slug = variant ? `${partner}-${variant}` : `${partner}-sidebar`;
  const href = `/out/${slug}`;
  const partnerData = affiliatePartners[partner];
  const name = partnerData?.name ?? partner;

  return (
    <div className="affiliate-sidebar">
      <span className="affiliate-sidebar__label">{label ?? 'Featured Tool'}</span>
      <span className="affiliate-sidebar__title">{title ?? name}</span>
      <a
        href={href}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="affiliate-sidebar__link"
        data-ph-capture-attribute-affiliate={`sidebar-${partner}`}
      >
        {buttonText ?? `Try ${name} Free`}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
