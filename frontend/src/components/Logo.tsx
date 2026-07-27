interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

const sizeMap = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export function Logo({ size = 'md', showPulse = true }: LogoProps) {
  return (
    <div className="inline-flex flex-col gap-1.5">
      <div className={`flex items-center gap-2 font-display font-semibold tracking-tight ${sizeMap[size]}`}>
        <span className="text-spark">⚡</span>
        <span className="text-text">AITELLION</span>
      </div>
      {showPulse && <div className="voltage-line rounded-full" />}
    </div>
  );
}

export function BrandFooter() {
  return (
    <p className="text-xs text-text-faint font-mono">
      Built by <span className="text-text-muted">⚡ Team StackVolt</span>
    </p>
  );
}
