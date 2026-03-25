// Framework-agnostic utility functions
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fi-FI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

// Scroll active utility for navigation highlighting
export function onScroll(): void {
  // Use IntersectionObserver to detect active section without reading layout synchronously.
  const sections = document.querySelectorAll<HTMLElement>('[id]');
  const navLinks = document.querySelectorAll<HTMLElement>('.ud-menu-scroll');

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('id') || '';
        const matching = Array.from(navLinks).find((link) =>
          (link as HTMLAnchorElement).getAttribute('href')?.includes(`#${id}`),
        );
        if (entry.isIntersecting && matching) {
          matching.classList.add('text-primary');
        } else if (matching) {
          matching.classList.remove('text-primary');
        }
      });
    },
    { root: null, rootMargin: '-40% 0px -55% 0px', threshold: 0 },
  );

  sections.forEach((s) => observer.observe(s));
}
