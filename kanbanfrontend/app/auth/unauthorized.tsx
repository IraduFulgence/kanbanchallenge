import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h2 className="text-lg font-semibold">Please sign in</h2>
      <p className="text-sm text-foreground/60">You need to be signed in to view this page.</p>
      <Link href="/auth/login" className="text-brand hover:underline text-sm">
        Go to login
      </Link>
    </div>
  );
}