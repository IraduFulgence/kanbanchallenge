// AuthLayout.tsx — shared wrapper
export default function AuthLayout({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-white px-4 py-12 dark:bg-gray-900 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-gray-800 sm:p-8">
          
          <div className="mt-6">{children}</div>
        </div>
      </div>
    );
  }