"use client";

import { forwardRef } from "react";

// ─── Button ──────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

const btnBase =
  "flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40";

const btnSize: Record<string, string> = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-10 px-5 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

const btnVariant: Record<string, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover",
  secondary:
    "bg-surface text-primary border border-border hover:border-primary hover:bg-primary-light",
  ghost: "bg-transparent text-text-secondary hover:bg-primary-light hover:text-primary",
  danger: "bg-error/10 text-error hover:bg-error/20",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${btnBase} ${btnSize[size]} ${btnVariant[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-10 w-full rounded-xl border bg-surface px-3.5 text-sm text-text placeholder-text-secondary/50 transition focus:border-primary focus:ring-3 focus:ring-primary/10 ${
            error ? "border-error" : "border-border"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
        {helper && !error && (
          <p className="text-xs text-text-secondary">{helper}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// ─── Select ──────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-text"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`h-10 w-full rounded-xl border bg-surface px-3.5 text-sm text-text transition focus:border-primary focus:ring-3 focus:ring-primary/10 ${
          error ? "border-error" : "border-border"
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", hover, onClick }: CardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`rounded-[20px] border border-border bg-surface shadow-card transition-all duration-200 ${
        hover
          ? "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card"
          : ""
      } ${onClick ? "w-full text-left" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

// ─── Badge ───────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "primary";
  className?: string;
}

const badgeVariant: Record<string, string> = {
  default: "bg-border/50 text-text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  primary: "bg-primary-light text-primary",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeVariant[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// ─── Spinner ─────────────────────────────────────────────

export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${dim}`}
      role="status"
      aria-label="Loading"
    />
  );
}

// ─── SectionHeader ───────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  count?: number;
  actions?: React.ReactNode;
}

export function SectionHeader({ title, count, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-text">{title}</h2>
        {count !== undefined && (
          <span className="text-xs text-text-secondary">{count}</span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-surface/50 px-8 py-16 text-center">
      {icon && <div className="mb-4 text-text-secondary/40">{icon}</div>}
      <h3 className="text-base font-medium text-text">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-text-secondary">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-border/60 ${className}`}
    />
  );
}

// ─── StatusBadge ─────────────────────────────────────────

const statusStyles: Record<string, string> = {
  DRAFT: "bg-border/50 text-text-secondary",
  IN_REVIEW: "bg-warning/10 text-warning",
  LAWYER_VERIFIED: "bg-primary-light text-primary",
  BANK_APPROVED: "bg-success/10 text-success",
  CLOSED: "bg-text text-surface",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="default" className={statusStyles[status] ?? ""}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

// ─── RoleBadge ───────────────────────────────────────────

const roleStyles: Record<string, string> = {
  BUYER: "bg-primary-light text-primary",
  SELLER: "bg-warning/10 text-warning",
  BANK: "bg-success/10 text-success",
  LAWYER: "bg-[#EEF2FF] text-[#4F46E5]",
  BROKER: "bg-[#FEF3C7] text-[#D97706]",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        roleStyles[role] ?? "bg-border/50 text-text-secondary"
      }`}
    >
      {role}
    </span>
  );
}
