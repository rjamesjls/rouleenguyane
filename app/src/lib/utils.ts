export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function calculateNbJours(dateDebut: string, dateFin: string): number {
  const d1 = new Date(dateDebut);
  const d2 = new Date(dateFin);
  const diff = d2.getTime() - d1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calculatePrixTotal(
  prixJour: number,
  nbJours: number,
  fraisServicePercent: number = 0.10
): { sousTtotal: number; fraisService: number; total: number } {
  const sousTtotal = prixJour * nbJours;
  const fraisService = Math.round(sousTtotal * fraisServicePercent * 100) / 100;
  const total = sousTtotal + fraisService;
  return { sousTtotal, fraisService, total };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

export function generateStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

export function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `il y a ${hours}h`;
  if (minutes > 0) return `il y a ${minutes} min`;
  return 'À l\'instant';
}
