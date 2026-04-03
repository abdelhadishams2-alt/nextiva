'use client';

interface Author {
  name: string;
  role: string;
  avatar: string;
  verified?: boolean;
}

interface MethodologyBoxProps {
  text: string;
  authors: Author[];
  learnMoreUrl: string;
}

export default function MethodologyBox({ text, authors, learnMoreUrl }: MethodologyBoxProps) {
  return (
    <div className="methodology-box">
      <div className="methodology-box__text">
        <p className="methodology-box__description">{text}</p>
        <a href={learnMoreUrl} className="methodology-box__link">
          Learn more about our methodology <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
      <div className="methodology-box__authors">
        {authors.map((author, i) => (
          <div key={i} className="methodology-box__author">
            <img
              src={author.avatar}
              alt={author.name}
              className="methodology-box__avatar"
              loading="lazy"
              width={80}
              height={80}
            />
            <div className="methodology-box__author-info">
              <p className="methodology-box__author-name">
                {author.name}
                {author.verified !== false && (
                  <svg
                    className="methodology-box__verified"
                    width="15"
                    height="15"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-label="Verified"
                  >
                    <circle cx="8" cy="8" r="8" fill="currentColor" />
                    <path
                      d="M5 8L7 10L11 6"
                      stroke="#fff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </p>
              <p className="methodology-box__author-role">{author.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
