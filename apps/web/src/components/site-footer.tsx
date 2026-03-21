import clsx from 'clsx';
import Link from 'next/link';
import Logo from '@/assets/logo';

export default function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={clsx(
        'w-full bg-card-foreground py-10 text-sm text-accent/80',
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-6 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        {/* Logo + brand */}
        <div className="flex items-center gap-2 text-primary">
          <Logo size={42} />
          <span className="text-2xl font-semibold tracking-tight">Temar</span>
        </div>

        {/* Link columns — right-aligned group */}
        <div className="flex gap-16">
          {/* Legal */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-card mb-1">
              Legal
            </h4>
            <Link
              href="/privacy"
              className="transition-colors hover:text-accent"
            >
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-accent">
              Terms
            </Link>
            <Link
              href="/refunds"
              className="transition-colors hover:text-accent"
            >
              Refunds
            </Link>
          </div>

          {/* Pricing */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-card mb-1">
              Product
            </h4>
            <Link
              href="/pricing"
              className="hover:text-accent transition-colors"
            >
              Pricing
            </Link>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-card mb-1">
              Contact
            </h4>
            <a
              href="mailto:support@temar.app"
              className="hover:text-accent transition-colors"
            >
              support@temar.app
            </a>
          </div>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="mx-auto max-w-6xl px-6 mt-8 pt-6 border-t border-accent/10 text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} Temar. All rights reserved.
      </div>
    </footer>
  );
}
