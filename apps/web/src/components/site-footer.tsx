import clsx from 'clsx';
import Link from 'next/link';

export default function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={clsx(
        'border-t w-full py-5 text-center text-xs text-muted-foreground',
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Temar. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/pricing"
            className="hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <a
            href="mailto:contact@temar.app"
            className="hover:text-foreground transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
