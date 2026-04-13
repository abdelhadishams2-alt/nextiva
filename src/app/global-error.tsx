'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          @font-face { font-family: "remixicon"; src: url("/fonts/remixicon.woff2") format("woff2"); font-display: swap; }
          .error-page i[class^="ri-"] { font-family: 'remixicon' !important; font-style: normal; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
          .ri-error-warning-line:before { content: "\\eca1"; }
        `}} />
      </head>
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
