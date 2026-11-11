export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}j lalu`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}h lalu`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMatchScore(score?: number | null): string {
  if (score === undefined || score === null) return '0%';
  const percentage = Math.round(score > 1 ? score : score * 100);
  return `${Math.min(100, Math.max(0, percentage))}%`;
}

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
