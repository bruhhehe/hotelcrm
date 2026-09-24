import { Logo } from "@/components/app-shell/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <header className="mb-6">
        <Logo />
      </header>
      <main className="w-full max-w-md">{children}</main>
    </div>
  );
}
