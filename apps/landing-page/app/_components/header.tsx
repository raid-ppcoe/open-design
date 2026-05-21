/*
 * Sticky Header — static markup rendered at build time. Headroom-style
 * hide/show and the live GitHub star count are attached by the tiny inline
 * scripts on each Astro page, so this marketing page ships no React runtime
 * to the browser.
 *
 * The nav links go to internal multi-page routes (`/skills/`, `/systems/`,
 * `/templates/`, `/craft/`) so Google sees a real site hierarchy. Numbers
 * reflect the live counts of the canonical Markdown bundles in the repo
 * root and are kept in sync with `getCatalogCounts()` at build time.
 */

import {
  DEFAULT_LOCALE,
  getCommonCopy,
  getHeaderProductMenuCopy,
  localizedHref,
  type HeaderCopy,
  type LandingLocaleCode,
} from '../i18n';

const REPO = 'https://github.com/nexu-io/open-design';
const REPO_RELEASES = `${REPO}/releases`;

const ext = {
  target: '_blank',
  rel: 'noreferrer noopener',
} as const;

export interface HeaderProps {
  /** Nav highlight target. `'home'` is the default for `/`. */
  active?:
    | 'home'
    | 'product'
    | 'html-anything'
    | 'skills'
    | 'systems'
    | 'templates'
    | 'craft'
    | 'blog'
    | 'tutorials';
  /**
   * Live counts from the Markdown catalogs. Required so we can never
   * silently render stale fallback numbers when a caller forgets to
   * thread `getCatalogCounts()` through. Header only consumes these
   * four scalar fields; the homepage passes the wider `CatalogCounts`
   * value (with `byMode` / `byPlatform`) by structural subtyping.
   */
  counts: {
    skills: number;
    systems: number;
    templates: number;
    craft: number;
  };
  github?: {
    starsLabel: string;
  };
  /** UI locale for nav labels and accessibility text. */
  locale?: LandingLocaleCode;
  /** Optional override for callers that already resolved localized chrome. */
  copy?: HeaderCopy;
  /** Brand link target — `#top` on the homepage, `/` on sub-pages. */
  brandHref?: string;
}

export function Header({
  active = 'home',
  counts,
  github,
  locale = DEFAULT_LOCALE,
  copy,
  brandHref = '#top',
}: HeaderProps) {
  const linkClass = (key: NonNullable<HeaderProps['active']>) =>
    active === key ? 'is-active' : undefined;
  const headerCopy = copy ?? getCommonCopy(locale).header;
  const href = (path: string) => localizedHref(path, locale);
  const homeBrandHref = brandHref === '/' ? href('/') : brandHref;
  const contactHref = brandHref === '#top' ? '#contact' : href('/#contact');
  const productMenuCopy = getHeaderProductMenuCopy(locale);

  return (
    <header className='nav' data-od-id='nav'>
      <div className='container nav-inner'>
        <a href={homeBrandHref} className='brand'>
          <span className='brand-mark'>
            <img src='/logo.webp' alt='' width={36} height={36} />
          </span>
          <span className='brand-name'>Open Design</span>
          <span className='brand-meta'>
            <b>{headerCopy.brandMetaTitle}</b>
            {headerCopy.brandMetaBody}
          </span>
        </a>
        {/*
          Mobile / tablet hamburger. Hidden by CSS at ≥1100px (the desktop
          breakpoint where the full nav fits). At narrower widths it toggles
          `.is-open` on the parent <header> via a small handler in
          `header-enhancer.astro` — when open, the `<nav>` element below
          drops down underneath the header bar as a vertical list.
        */}
        <button
          type='button'
          className='nav-toggle'
          aria-label={productMenuCopy.toggleNavigationMenu}
          aria-controls='primary-nav'
          aria-expanded='false'
          data-nav-toggle
        >
          <span className='nav-toggle-icon' aria-hidden='true' />
        </button>
        <nav id='primary-nav' data-nav-primary>
          <ul className='nav-links'>
            <li className='has-dropdown'>
              {/*
                Product menu — top-level group exposing the Open Design family.
                CSS-only dropdown via :hover / :focus-within (no JS), so this
                still renders correctly under static export with no React
                runtime on the client. The trigger is a focusable <a> rather
                than a button so it remains a keyboard tab stop, with
                aria-haspopup signaling the submenu to assistive tech.
              */}
              <a
                href={href('/')}
                className={
                  active === 'product' ||
                  active === 'home' ||
                  active === 'html-anything' ||
                  active === 'tutorials'
                    ? 'is-active'
                    : undefined
                }
                aria-haspopup='true'
                aria-expanded='false'
              >
                {productMenuCopy.product}
                <span className='dropdown-caret' aria-hidden='true'>▾</span>
              </a>
              <ul className='nav-dropdown' role='menu'>
                <li role='none'>
                  <a
                    role='menuitem'
                    href={href('/')}
                    className={
                      active === 'home' || active === 'product'
                        ? 'is-active'
                        : undefined
                    }
                  >
                    <span className='dropdown-name'>{productMenuCopy.openDesignName}</span>
                    <span className='dropdown-blurb'>
                      {productMenuCopy.openDesignBlurb}
                    </span>
                  </a>
                </li>
                <li role='none'>
                  <a
                    role='menuitem'
                    href={href('/html-anything/')}
                    className={linkClass('html-anything')}
                  >
                    <span className='dropdown-name'>{productMenuCopy.htmlAnythingName}</span>
                    <span className='dropdown-blurb'>
                      {productMenuCopy.htmlAnythingBlurb}
                    </span>
                  </a>
                </li>
                <li role='none'>
                  <a
                    role='menuitem'
                    href={href('/tutorials/')}
                    className={linkClass('tutorials')}
                  >
                    <span className='dropdown-name'>{productMenuCopy.tutorialsName}</span>
                    <span className='dropdown-blurb'>
                      {productMenuCopy.tutorialsBlurb}
                    </span>
                  </a>
                </li>
              </ul>
            </li>
            <li>
              <a href={href('/skills/')} className={linkClass('skills')}>
                {headerCopy.nav.skills}
                <span className='num'>{counts.skills}</span>
              </a>
            </li>
            <li>
              <a href={href('/systems/')} className={linkClass('systems')}>
                {headerCopy.nav.systems}
                <span className='num'>{counts.systems}</span>
              </a>
            </li>
            <li>
              <a href={href('/templates/')} className={linkClass('templates')}>
                {headerCopy.nav.templates}
                <span className='num'>{counts.templates}</span>
              </a>
            </li>
            <li>
              <a href={href('/craft/')} className={linkClass('craft')}>
                {headerCopy.nav.craft}
                <span className='num'>{counts.craft}</span>
              </a>
            </li>
            <li>
              <a href={href('/blog/')} className={linkClass('blog')}>
                {headerCopy.nav.blog}
              </a>
            </li>
            <li>
              <a href={contactHref}>
                {headerCopy.nav.contact}
              </a>
            </li>
          </ul>
        </nav>
        <div className='nav-side'>
          <a
            className='nav-cta ghost'
            href={REPO_RELEASES}
            aria-label={headerCopy.downloadAria}
            title={headerCopy.downloadTitle}
            {...ext}
          >
            {headerCopy.download}
          </a>
          <a
            className='nav-cta'
            href={REPO}
            aria-label={headerCopy.starAria}
            title={headerCopy.starTitle}
            {...ext}
          >
            {headerCopy.starPrefix} ·{' '}
            <span data-github-stars>{github?.starsLabel ?? '40K+'}</span>
          </a>
          <span className='status-dot' aria-hidden='true' />
        </div>
      </div>
    </header>
  );
}
