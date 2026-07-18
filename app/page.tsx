import Link from "next/link";
import { ScanIntro } from "@/components/ScanIntro";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-[#FAF6EF] text-[#123524]">
      <nav className="flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="text-lg font-bold">Local Biz Grader</span>
        <Link
          href="/tools"
          className="rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium text-black/60 transition-colors hover:bg-black/5"
        >
          Internal tools
        </Link>
      </nav>
      <ScanIntro />
    </div>
  );
}
