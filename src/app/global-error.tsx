'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <section className="error-page">
          <div className="error-page__bg" />
          <div className="error-page__content">
            <div className="error-page__icon">
              <i className="ri-error-warning-line" />
            </div>
            <h1 className="error-page__title">Something went wrong</h1>
            <p className="error-page__desc">
              We hit an unexpected sandstorm. Our team has been notified and
              we&apos;re working to clear the path.
            </p>
            <div className="error-page__actions">
              <button onClick={reset} className="error-page__btn error-page__btn--primary">
                Try Again
              </button>
              <a href="/" className="error-page__btn error-page__btn--ghost">
                Back to Home
              </a>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
}
