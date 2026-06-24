export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  className = "",
}) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: `
      bg-gradient-to-r from-amber-400 to-amber-500
      text-slate-900 shadow-lg shadow-amber-500/20
      hover:from-amber-300 hover:to-amber-400
      hover:shadow-amber-400/30 hover:-translate-y-px
      focus:ring-amber-400
    `,
    secondary: `
      bg-slate-700/80 text-slate-200 border border-slate-600
      hover:bg-slate-600 hover:border-slate-500
      focus:ring-slate-500
    `,
    danger: `
      bg-red-500/15 text-red-400 border border-red-500/30
      hover:bg-red-500/25 hover:text-red-300
      focus:ring-red-500
    `,
    ghost: `
      text-slate-400 hover:text-white hover:bg-slate-700/50
      focus:ring-slate-500
    `,
    outline: `
      bg-transparent text-amber-400 border border-amber-400/50
      hover:bg-amber-400/10 focus:ring-amber-400
    `,
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
