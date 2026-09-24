import { Logo } from "@/components/app-shell/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center border-b px-4 sm:h-20 sm:px-10">
        <Logo />
      </header>
      <main className="flex flex-1 justify-center sm:items-start sm:px-4 sm:pt-16 sm:pb-16">
        <div className="w-full sm:max-w-[520px]">{children}</div>
      </main>
    </div>
  );
}
