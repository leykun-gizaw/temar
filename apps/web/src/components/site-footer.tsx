import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border w-full py-5 text-center text-xs text-muted-foreground">
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
        </div>
      </div>
    </footer>
  );
}
