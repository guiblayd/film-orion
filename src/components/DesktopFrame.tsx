import { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { DesktopAside } from './DesktopAside';
import { DesktopSidebar } from './DesktopSidebar';

type DesktopFrameProps = {
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
  mainClassName?: string;
  useDefaultAside?: boolean;
};

type DesktopPageProps = {
  children: ReactNode;
  width?: 'stream' | 'wide' | 'detail';
  className?: string;
};

type DesktopPageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

const PAGE_WIDTHS = {
  stream: 'lg:max-w-[860px]',
  wide: 'lg:max-w-[1120px]',
  detail: 'lg:max-w-[1040px]',
} as const;

export function DesktopFrame({
  children,
  aside,
  className,
  mainClassName,
  useDefaultAside = false,
}: DesktopFrameProps) {
  const showAside = useDefaultAside || Boolean(aside);

  return (
    <div className={cn('min-h-screen lg:px-8 lg:py-8 xl:px-10', className)}>
      <div
        className={cn(
          'mx-auto lg:grid lg:max-w-[1680px] lg:gap-10',
          showAside
            ? 'lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_300px]'
            : 'lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]'
        )}
      >
        <DesktopSidebar />
        <main className={cn('min-w-0', mainClassName)}>{children}</main>
        {showAside ? (
          <div className="hidden xl:block">
            {aside ?? (useDefaultAside ? <DesktopAside /> : null)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DesktopPage({ children, width = 'stream', className }: DesktopPageProps) {
  return <div className={cn(PAGE_WIDTHS[width], className)}>{children}</div>;
}

export function DesktopPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: DesktopPageHeaderProps) {
  return (
    <header className={cn('pb-6 lg:pb-8', className)}>
      {eyebrow ? (
        <p className="hidden text-[11px] uppercase tracking-[0.24em] text-zinc-500 lg:block">{eyebrow}</p>
      ) : null}
      <div className="lg:mt-4 lg:flex lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 lg:text-[40px] lg:leading-[1.02]">{title}</h1>
          {description ? (
            <p className="hidden max-w-3xl text-[15px] leading-7 text-zinc-500 lg:mt-3 lg:block">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="hidden shrink-0 lg:flex lg:items-center lg:gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
