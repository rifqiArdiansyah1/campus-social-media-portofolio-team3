import React from 'react';
import { Badge, BadgeVariant } from '../common/Badge';

export interface SkpiBadgeProps {
  status: string;
}

export function SkpiBadge({ status }: SkpiBadgeProps) {
  let label = status;
  let variant: BadgeVariant = 'default';

  switch (status.toLowerCase()) {
    case 'terverifikasi':
      label = 'Terverifikasi';
      variant = 'success';
      break;
    case 'menunggu_review':
      label = 'Menunggu Review';
      variant = 'warning';
      break;
    case 'ditolak':
      label = 'Ditolak';
      variant = 'danger';
      break;
    case 'draft':
      label = 'Draft';
      variant = 'neutral';
      break;
  }

  return <Badge label={label} variant={variant} />;
}
