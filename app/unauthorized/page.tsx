import Image from "next/image";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-off-black flex flex-col items-center justify-center px-6 text-center">
      <Image src="/logos/gwi-logo-on-black.svg" alt="GWI" width={84} height={26} className="mb-10" />
      <h1 className="text-white text-2xl font-bold mb-3">This app is for GWI staff only</h1>
      <p className="text-grey-5 max-w-sm">
        Sign in with your @gwi.com email address to access the keynote generator.
      </p>
      <a href="/login" className="mt-8 rounded-md bg-hot-pink px-6 py-3 text-white font-semibold">
        Back to sign in
      </a>
    </main>
  );
}
