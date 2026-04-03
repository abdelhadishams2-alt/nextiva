'use client';

interface NewsletterBannerProps {
  heading: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
}

export default function NewsletterBanner({
  heading,
  description,
  ctaText,
  ctaUrl,
}: NewsletterBannerProps) {
  return (
    <div className="newsletter-banner">
      <div className="newsletter-banner__content">
        <p className="newsletter-banner__heading">{heading}</p>
        <p className="newsletter-banner__description">{description}</p>
      </div>
      <a href={ctaUrl} className="newsletter-banner__btn">
        {ctaText}
      </a>
    </div>
  );
}
