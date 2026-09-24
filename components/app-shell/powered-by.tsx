import { LogoMark } from "./logo";

/**
 * Frame for guest-facing surfaces (booking widget, guest portal): the page is the hotel's, so
 * Lodgely appears only as a quiet credit, never as the headline. No hotel name is guessed
 * from the URL; hotel branding arrives with the hotels table.
 */
export function GuestFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <p className="mx-auto flex max-w-2xl items-center gap-1.5 px-4 py-5 text-sm text-muted-foreground">
          <LogoMark className="size-4 text-primary" />
          Powered by Lodgely
        </p>
      </footer>
    </div>
  );
}
