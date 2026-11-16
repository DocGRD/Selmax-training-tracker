import Image from "next/image";
import { cn } from "cn";

// Unoptimized next/image does not prefix public-folder src with basePath.
const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={asset("/brand/selmax-logo.png")}
      alt="SELMAX Corporation"
      width={276}
      height={105}
      priority={priority}
      className={cn("h-9 w-auto", className)}
    />
  );
}

export function Mark({ className }: { className?: string }) {
  return (
    <Image
      src={asset("/brand/selmax-mark.png")}
      alt=""
      width={192}
      height={192}
      className={cn("h-8 w-8", className)}
    />
  );
}
