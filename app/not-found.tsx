import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#f3f0ea] px-6">
      <div className="max-w-sm text-center">
        <p className="font-display text-5xl tracking-wide">404</p>
        <p className="mt-2 text-sm text-[#5e584f]">That page is not in the training plan.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm text-white">
          Back to sign-in
        </Link>
      </div>
    </div>
  );
}
