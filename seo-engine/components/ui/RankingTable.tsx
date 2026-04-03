'use client';

interface RankingRow {
  rank: string;
  name: string;
  partner: string;
  label: string;
  rating: string;
  ctaText: string;
  logo: string;
  logoAlt: string;
  reviewUrl: string;
  pricing: string[];
  pricingTip: string;
  pricingLinkText: string;
  pricingUrl: string;
  pros: string[];
  cons: string[];
  moreText: string;
  moreUrl: string;
}

interface RankingTableProps {
  heading: string;
  rows: RankingRow[];
}

export default function RankingTable({ heading, rows }: RankingTableProps) {
  return (
    <section className="ranking-table-section">
      <h2>{heading}</h2>
      <div className="ranking-table__scroll">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tool</th>
              <th>Pricing</th>
              <th>Pros and Cons</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.partner}>
                {/* Rank */}
                <td data-th="#">{row.rank}</td>

                {/* Tool info */}
                <td data-th="Tool">
                  <div className="ranking-table__tool">
                    <img
                      src={row.logo}
                      alt={row.logoAlt}
                      width={180}
                      height={60}
                      className="ranking-table__logo"
                    />
                    <a href={row.reviewUrl} className="ranking-table__name">
                      {row.name}
                    </a>
                    <p className="ranking-table__label"><em>{row.label}</em></p>
                    <div
                      className="ranking-table__circle"
                      style={{
                        background: `conic-gradient(var(--brand-navy) ${(parseFloat(row.rating) / 5) * 100}%, var(--border-subtle) 0 100%)`,
                      }}
                    >
                      <span>{row.rating}</span>
                    </div>
                    <a
                      href={`/out/${row.partner}-ranking`}
                      className="ranking-table__btn"
                      target="_blank"
                      rel="nofollow sponsored noopener"
                    >
                      {row.ctaText}
                    </a>
                  </div>
                </td>

                {/* Pricing */}
                <td data-th="Pricing">
                  <ul className="ranking-table__pricing">
                    {row.pricing.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <p className="ranking-table__tip"><strong>Tip:</strong> {row.pricingTip}</p>
                  <p className="ranking-table__link">
                    <span className="ranking-table__arrow">&rsaquo;</span>{' '}
                    <a href={row.pricingUrl}>{row.pricingLinkText}</a>
                  </p>
                </td>

                {/* Pros and Cons */}
                <td data-th="Pros and Cons">
                  <div className="ranking-table__pros">
                    <ul>
                      {row.pros.map((pro, i) => (
                        <li key={i}>
                          <svg className="ranking-table__icon ranking-table__icon--check" viewBox="0 0 12 12">
                            <path d="M1 6.5L4.5 10L11 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="ranking-table__cons">
                    <ul>
                      {row.cons.map((con, i) => (
                        <li key={i}>
                          <svg className="ranking-table__icon ranking-table__icon--cross" viewBox="0 0 12 12">
                            <path d="M2 2L10 10M10 2L2 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="ranking-table__link">
                    <span className="ranking-table__arrow">&rsaquo;</span>{' '}
                    <a href={row.moreUrl}>{row.moreText}</a>
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
