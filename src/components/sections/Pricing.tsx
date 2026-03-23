'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const ArrowIcon = () => (
  <span className="pricing__btn-arrow">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="7" width="10" height="2" rx="1" />
      <path d="M9.5 3.5L14 8l-4.5 4.5V3.5z" />
    </svg>
  </span>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 22C6.47715 22 2 17.5228 2 12 2 6.47715 6.47715 2 12 2 17.5228 2 22 6.47715 22 12 22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12 20 7.58172 16.4183 4 12 4 7.58172 4 4 7.58172 4 12 4 16.4183 7.58172 20 12 20ZM13 10.5V15H14V17H10V15H11V12.5H10V10.5H13ZM13.5 8C13.5 8.82843 12.8284 9.5 12 9.5 11.1716 9.5 10.5 8.82843 10.5 8 10.5 7.17157 11.1716 6.5 12 6.5 12.8284 6.5 13.5 7.17157 13.5 8Z" />
  </svg>
);

function AnimatedPrice({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  const [animClass, setAnimClass] = useState('');
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current === value) return;
    prevRef.current = value;

    // Slide out
    setAnimClass('pricing__amount--out');

    const timer = setTimeout(() => {
      setDisplay(value);
      setAnimClass('pricing__amount--in');

      const timer2 = setTimeout(() => {
        setAnimClass('');
      }, 300);

      return () => clearTimeout(timer2);
    }, 200);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <span className={`pricing__amount ${animClass}`}>{display}</span>
  );
}

type BusinessType = 'small-business' | 'enterprise';
type BillingCycle = 'monthly' | 'annually';

interface FeatureItem {
  text: string;
  tooltip?: string;
  lightTooltip?: boolean;
}

interface PlanCardProps {
  badge: string;
  name: string;
  tagline: string;
  priceContent: React.ReactNode;
  savingsContent?: React.ReactNode;
  description: string;
  includesLabel?: string;
  features: FeatureItem[];
  addon?: boolean;
  addonLabel: string;
  addonText: string;
  ctaText: string;
  ctaStyle: 'secondary' | 'white';
  variant?: 'default' | 'featured' | 'dark';
}

const TOOLTIPS_SMALL_BUSINESS = {
  core: [
    'Connect with customers and your team using award-winning, reliable voice conversations within the U.S. and CA. Get a new number or bring over your existing number for free.',
    'Send and receive SMS text messages from your business phone number using the desktop and mobile app.',
    'Collaborate face-to-face with video meetings. Engage in sidebar chats and record for future reference.',
    'Get on the same page by sharing your screen during a video call or exchanging key files.',
    'Ensure all customer inquiries are professionally handled and properly routed to the right team member.',
    '',
    '',
  ],
  engage: [
    'Enable customers to reach your entire team via a shared SMS inbox, allowing multiple team members to access messages, respond promptly, and deliver faster resolutions.',
    'Give your business a professional edge by offering a universal, non-local, toll-free number.',
    'Move your business forward with insight gained from data found within your voice analytics.',
    'Manage high-volume inbound calls and use touch tone prompts to route calls to best-fit agents.',
    'Offer 24/7 support and efficiently manage responses to FAQs with web chatbot automation. Start with automated prompts to gather essential information, then seamlessly transition to a live-agent interaction.',
  ],
  powerSuite: [
    'Provide consistent support across voice and web chat channels. Use web chatbots to collect key information upfront and offer 24/7 self-service, with the option to transfer to a live agent when needed.',
    'Let agents handle both incoming and outgoing calls in a single interface—maximizing productivity and reducing idle time.',
    'Automatically capture the content of voice conversations in real time and create post-call summaries.',
    'Improve first-call resolution by routing callers to best-fit agents equipped to handle interactions specific to area of expertise, language, or demographic.',
    'Design and automate customer journeys across channels with a visual workflow builder. Create seamless experiences from first contact to resolution.',
  ],
};

const TOOLTIPS_ENTERPRISE = {
  essential: [
    'Maximize productivity by incorporating both inbound and outbound calls to agents\' workflow across voice and digital channels.',
    'Build a complete customer journey with drag-and-drop ease. Incorporate IVR, enhanced routing, voice bot-to-agent hand-off for a blended AI and human experience.',
    'Increase productivity when AI takes call notes for you in real time and creates an automatic summary of the conversation.',
    'Improve first-call resolution by routing callers to best-fit agents equipped to handle interactions specific to area of expertise, language, or demographic.',
    '',
  ],
  professional: [
    'Enable customers to resolve issues independently with intelligent self-service options including IVR, chatbots, and knowledge base integrations.',
    'Improve agent performance and training opportunities by empowering supervisors to monitor both voice and digital interactions, providing instant feedback to agents.',
    'Built right in, an AI bot ensures PCI-compliant transactions where agents neither see nor hear credit card information.',
    'Progressive and Predictive Dialing streamline outreach, with Quarterback Mode routing live calls to available agents for efficiency and personalization.',
    '',
  ],
  premium: [
    'Ensure you\'re properly staffed by surfacing and analyzing historical data such as volume, wait time, and more.',
    'Send callers to the best-fit agent based on skills, language, or expertise—helping resolve issues faster on the first try.',
    'Generate advanced insight on existing data by creating and visualizing customized data drill downs.',
    '',
    '',
  ],
};

function PlanCard({
  badge,
  name,
  tagline,
  priceContent,
  savingsContent,
  description,
  includesLabel,
  features,
  addon,
  addonLabel,
  addonText,
  ctaText,
  ctaStyle,
  variant = 'default',
}: PlanCardProps) {
  const cardClass = [
    'pricing__card',
    variant === 'featured' ? 'pricing__card--featured' : '',
    variant === 'dark' ? 'pricing__card--dark' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      <div className="pricing__card-header">
        <span className="pricing__badge">{badge}</span>
        <h3 className="pricing__plan-name">{name}</h3>
        <p className="pricing__tagline">{tagline}</p>
        {priceContent}
        {savingsContent}
      </div>

      <div className="pricing__card-body">
        <p className="pricing__description">{description}</p>
        {includesLabel && <p className="pricing__includes">{includesLabel}</p>}
        <ul className="pricing__features">
          {features.map((f, i) => (
            <li key={i}>
              <span className="pricing__feature-icon">✓</span>
              <span className="pricing__feature-text">{f.text}</span>
              {f.tooltip && (
                <span
                  className={`pricing__tooltip-trigger${f.lightTooltip ? ' pricing__tooltip-trigger--light' : ''}`}
                  data-tooltip={f.tooltip}
                >
                  <InfoIcon />
                </span>
              )}
            </li>
          ))}
        </ul>

        {addon && (
          <div className="pricing__addon">
            <span className="pricing__addon-icon">
              <Image src="/assets/xbert-icon-dark.png" alt="" width={19} height={28} className="pricing__addon-xbert" />
            </span>
            <span className="pricing__addon-text">
              <strong>{addonLabel}</strong> {addonText}
            </span>
            <span
              className={`pricing__tooltip-trigger${variant === 'dark' ? ' pricing__tooltip-trigger--light' : ''}`}
              data-tooltip="XBert is your 24/7 AI receptionist, built to reliably answer every call, text, and chat, so you never miss another lead again."
            >
              <InfoIcon />
            </span>
          </div>
        )}
      </div>

      <div className="pricing__card-footer">
        <a href="#" className={`pricing__cta pricing__cta--${ctaStyle}`}>
          <span className="pricing__btn-text">{ctaText}</span>
          <ArrowIcon />
        </a>
      </div>
    </div>
  );
}

export function Pricing() {
  const t = useTranslations('Pricing');
  const [businessType, setBusinessType] = useState<BusinessType>('small-business');
  const [billing, setBilling] = useState<BillingCycle>('annually');

  const isAnnual = billing === 'annually';
  const isSmallBusiness = businessType === 'small-business';

  function buildFeatures(
    keys: string[],
    prefix: string,
    tooltips: string[],
    lightTooltip?: boolean,
  ): FeatureItem[] {
    return keys.map((key, i) => ({
      text: t(`${prefix}.features.${key}`),
      tooltip: tooltips[i] || undefined,
      lightTooltip,
    }));
  }

  const renderSmallBusinessPlans = () => (
    <div className="pricing__plans">
      {/* Core */}
      <PlanCard
        badge={t('smallBusiness.core.badge')}
        name={t('smallBusiness.core.name')}
        tagline={t('smallBusiness.core.tagline')}
        priceContent={
          <div className="pricing__price">
            <span className="pricing__currency">$</span>
            <AnimatedPrice value={isAnnual ? t('smallBusiness.core.priceAnnually') : t('smallBusiness.core.priceMonthly')} />
            <span className="pricing__period">{t('perUserMo')}</span>
          </div>
        }
        savingsContent={
          isAnnual ? (
            <div className="pricing__savings">
              <span className="pricing__original">{t('smallBusiness.core.originalAnnually')}</span>
              <span className="pricing__savings-badge">{t('smallBusiness.core.savingsAnnually')}</span>
            </div>
          ) : (
            <div className="pricing__savings" />
          )
        }
        description={t('smallBusiness.core.description')}
        features={buildFeatures(
          ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'],
          'smallBusiness.core',
          TOOLTIPS_SMALL_BUSINESS.core,
        )}
        addon
        addonLabel={t('addonLabel')}
        addonText={t('addonText')}
        ctaText={t('getStarted')}
        ctaStyle="secondary"
      />

      {/* Engage */}
      <PlanCard
        badge={t('smallBusiness.engage.badge')}
        name={t('smallBusiness.engage.name')}
        tagline={t('smallBusiness.engage.tagline')}
        priceContent={
          <div className="pricing__price">
            <span className="pricing__currency">$</span>
            <AnimatedPrice value={isAnnual ? t('smallBusiness.engage.priceAnnually') : t('smallBusiness.engage.priceMonthly')} />
            <span className="pricing__period">{t('perUserMo')}</span>
          </div>
        }
        savingsContent={
          isAnnual ? (
            <div className="pricing__savings">
              <span className="pricing__original">{t('smallBusiness.engage.originalAnnually')}</span>
              <span className="pricing__savings-badge">{t('smallBusiness.engage.savingsAnnually')}</span>
            </div>
          ) : (
            <div className="pricing__savings" />
          )
        }
        description={t('smallBusiness.engage.description')}
        includesLabel={t('smallBusiness.engage.includes')}
        features={buildFeatures(
          ['f1', 'f2', 'f3', 'f4', 'f5'],
          'smallBusiness.engage',
          TOOLTIPS_SMALL_BUSINESS.engage,
        )}
        addon
        addonLabel={t('addonLabel')}
        addonText={t('addonText')}
        ctaText={t('getADemo')}
        ctaStyle="secondary"
        variant="featured"
      />

      {/* Power Suite CX */}
      <PlanCard
        badge={t('smallBusiness.powerSuite.badge')}
        name={t('smallBusiness.powerSuite.name')}
        tagline={t('smallBusiness.powerSuite.tagline')}
        priceContent={
          <div className="pricing__price">
            <span className="pricing__currency">$</span>
            <AnimatedPrice value={isAnnual ? t('smallBusiness.powerSuite.priceAnnually') : t('smallBusiness.powerSuite.priceMonthly')} />
            <span className="pricing__period">{t('perUserMo')}</span>
          </div>
        }
        savingsContent={
          <div className="pricing__savings">
            <span className="pricing__agent-limit">{t('smallBusiness.powerSuite.agentLimit')}</span>
          </div>
        }
        description={t('smallBusiness.powerSuite.description')}
        includesLabel={t('smallBusiness.powerSuite.includes')}
        features={buildFeatures(
          ['f1', 'f2', 'f3', 'f4', 'f5'],
          'smallBusiness.powerSuite',
          TOOLTIPS_SMALL_BUSINESS.powerSuite,
          true,
        )}
        addon
        addonLabel={t('addonLabel')}
        addonText={t('addonText')}
        ctaText={t('getADemo')}
        ctaStyle="white"
        variant="dark"
      />
    </div>
  );

  const renderEnterprisePlans = () => (
    <div className="pricing__plans">
      {/* Essential */}
      <PlanCard
        badge={t('enterprise.essential.badge')}
        name={t('enterprise.essential.name')}
        tagline={t('enterprise.essential.tagline')}
        priceContent={
          <div className="pricing__price">
            <span className="pricing__from">{t('from')}</span>
            <span className="pricing__currency">$</span>
            <span className="pricing__amount">{t('enterprise.essential.price')}</span>
            <span className="pricing__period">{t('perAgentMo')}</span>
          </div>
        }
        description={t('enterprise.essential.description')}
        includesLabel={t('enterprise.essential.includes')}
        features={buildFeatures(
          ['f1', 'f2', 'f3', 'f4', 'f5'],
          'enterprise.essential',
          TOOLTIPS_ENTERPRISE.essential,
        )}
        addonLabel={t('addonLabel')}
        addonText={t('addonText')}
        ctaText={t('getADemo')}
        ctaStyle="secondary"
      />

      {/* Professional */}
      <PlanCard
        badge={t('enterprise.professional.badge')}
        name={t('enterprise.professional.name')}
        tagline={t('enterprise.professional.tagline')}
        priceContent={
          <div className="pricing__price pricing__price--contact">
            <span className="pricing__contact-sales">{t('contactSales')}</span>
          </div>
        }
        description={t('enterprise.professional.description')}
        includesLabel={t('enterprise.professional.includes')}
        features={buildFeatures(
          ['f1', 'f2', 'f3', 'f4', 'f5'],
          'enterprise.professional',
          TOOLTIPS_ENTERPRISE.professional,
        )}
        addonLabel={t('addonLabel')}
        addonText={t('addonText')}
        ctaText={t('getADemo')}
        ctaStyle="secondary"
        variant="featured"
      />

      {/* Premium */}
      <PlanCard
        badge={t('enterprise.premium.badge')}
        name={t('enterprise.premium.name')}
        tagline={t('enterprise.premium.tagline')}
        priceContent={
          <div className="pricing__price pricing__price--contact">
            <span className="pricing__contact-sales">{t('contactSales')}</span>
          </div>
        }
        description={t('enterprise.premium.description')}
        includesLabel={t('enterprise.premium.includes')}
        features={buildFeatures(
          ['f1', 'f2', 'f3', 'f4', 'f5'],
          'enterprise.premium',
          TOOLTIPS_ENTERPRISE.premium,
          true,
        )}
        addonLabel={t('addonLabel')}
        addonText={t('addonText')}
        ctaText={t('getADemo')}
        ctaStyle="white"
        variant="dark"
      />
    </div>
  );

  return (
    <section className="pricing">
      <div className="pricing__container">
        <div className="pricing__header">
          <span className="pricing__eyebrow">{t('eyebrow')}</span>
          <h2 className="pricing__title">{t('title')}</h2>
          <p className="pricing__subtitle">{t('subtitle')}</p>

          <div className="pricing__toggle pricing__toggle--type">
            <button
              className={`pricing__toggle-btn${isSmallBusiness ? ' pricing__toggle-btn--active' : ''}`}
              onClick={() => setBusinessType('small-business')}
            >
              {t('toggleSmallBusiness')}
            </button>
            <button
              className={`pricing__toggle-btn${!isSmallBusiness ? ' pricing__toggle-btn--active' : ''}`}
              onClick={() => setBusinessType('enterprise')}
            >
              {t('toggleEnterprise')}
            </button>
          </div>

          {isSmallBusiness && (
            <div className="pricing__toggle-wrapper">
              <div className="pricing__toggle pricing__toggle--billing">
                <span
                  className={`pricing__toggle-btn${!isAnnual ? ' pricing__toggle-btn--active' : ''}`}
                  onClick={() => setBilling('monthly')}
                >
                  {t('toggleMonthly')}
                </span>
                <span
                  className={`pricing__toggle-btn${isAnnual ? ' pricing__toggle-btn--active' : ''}`}
                  onClick={() => setBilling('annually')}
                >
                  {t('toggleAnnually')}
                </span>
              </div>
              <span className="pricing__toggle-badge">{t('saveBadge')}</span>
            </div>
          )}
        </div>

        {isSmallBusiness ? renderSmallBusinessPlans() : renderEnterprisePlans()}

        <div className="pricing__footer">
          <p className="pricing__note">{t('footerNote')}</p>
        </div>
      </div>
    </section>
  );
}
