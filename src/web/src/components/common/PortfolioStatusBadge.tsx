import React from "react";
import { CheckCircle2, Clock, XCircle, FileText } from "lucide-react";

export type PortfolioStatus = "draft" | "menunggu_review" | "terverifikasi" | "ditolak";

export interface PortfolioStatusBadgeProps {
  status: PortfolioStatus;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  PortfolioStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  draft: {
    label: "Draf",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    icon: FileText,
  },
  menunggu_review: {
    label: "Menunggu Review",
    bg: "bg-amber-50",
    text: "text-accent-amber-accessible",
    border: "border-amber-300",
    icon: Clock,
  },
  terverifikasi: {
    label: "Terverifikasi SKPI",
    bg: "bg-emerald-50",
    text: "text-accent-emerald-accessible",
    border: "border-emerald-300",
    icon: CheckCircle2,
  },
  ditolak: {
    label: "Ditolak",
    bg: "bg-red-50",
    text: "text-accent-danger-accessible",
    border: "border-red-300",
    icon: XCircle,
  },
};

export function PortfolioStatusBadge({
  status,
  showIcon = true,
  className = "",
}: PortfolioStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  const IconComponent = config.icon;

  return (
    <span
      data-testid={`portfolio-badge-${status}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
