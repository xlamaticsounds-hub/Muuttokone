// Framework-agnostic utility functions
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fi-FI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
  const sections = document.querySelectorAll('[id]');
  const navLinks = document.querySelectorAll('.ud-menu-scroll');
  
  let current = '';
  
  sections.forEach((section) => {
    const sectionTop = (section as HTMLElement).offsetTop;
    const sectionHeight = (section as HTMLElement).offsetHeight;
    
    if (window.pageYOffset >= sectionTop - 200) {
      current = section.getAttribute('id') || '';
    }
  });

  navLinks.forEach((link) => {
    const href = (link as HTMLAnchorElement).getAttribute('href');
    if (href?.includes(current) && current !== '') {
      link.classList.add('text-primary');
    } else {
      link.classList.remove('text-primary');
    }
  });
}
