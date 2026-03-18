import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

const logos = [
  { src: '/assets/logos/taco-bell.svg', alt: 'Taco Bell' },
  { src: '/assets/logos/kfc.svg', alt: 'KFC' },
  { src: '/assets/logos/amazon.svg', alt: 'Amazon' },
  { src: '/assets/logos/san-antonio-spurs.svg', alt: 'San Antonio Spurs' },
  { src: '/assets/logos/ups.svg', alt: 'UPS' },
  { src: '/assets/logos/hyundai.svg', alt: 'Hyundai' },
  { src: '/assets/logos/einstein-bros-bagels.svg', alt: 'Einstein Bros Bagels' },
  { src: '/assets/logos/ikea.svg', alt: 'IKEA' },
  { src: '/assets/logos/aaa.svg', alt: 'AAA' },
  { src: '/assets/logos/texas-roadhouse.svg', alt: 'Texas Roadhouse' },
  { src: '/assets/logos/shelby.svg', alt: 'Shelby' },
];

export async function LogoTrustBar() {
  const t = await getTranslations('LogoTrustBar');

  // Duplicate logos for seamless infinite scroll
  const allLogos = [...logos, ...logos];

  return (
    <section className="logo-trust-bar">
      <div className="logo-trust-bar__wrapper">
        <div className="logo-trust-bar__text">
          <p>
            <svg className="logo-trust-bar__icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11.0026 16L18.0737 8.92893L16.6595 7.51472L11.0026 13.1716L8.17421 10.3431L6.75999 11.7574L11.0026 16Z" />
            </svg>
            {t('text')}
          </p>
        </div>
        <div className="logo-trust-bar__marquee-container">
          <div className="logo-trust-bar__marquee">
            <div className="logo-trust-bar__track">
              {allLogos.map((logo, i) => (
                <div className="logo-trust-bar__item" key={`${logo.alt}-${i}`}>
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={120}
                    height={40}
                    className="logo-trust-bar__img"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
