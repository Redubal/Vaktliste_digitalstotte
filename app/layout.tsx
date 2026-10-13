import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { after } from "next/server";
import { Figur } from "@/components/figur/Figur";
import { IdentitetsVelger } from "@/components/IdentitetsVelger";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { synkHvisForfalt } from "@/lib/synk";
import { getAnsatte } from "@/lib/vaktlista";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital Støtte - Vaktlista",
  description: "Ukeplan og ansatt-katalog for teamene i Digital støtte, Vestfold fylkeskommune.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { innstillinger, synk } = lesVaktliste();
  // Ingen tidsplanlegger på serveren: en forfalt synk kjøres etter at siden er sendt, og vises ved neste lasting.
  after(() => synkHvisForfalt(synk));
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  const ansatte = getAnsatte();
  const jeg = finnAnsatt(ansatte, valgtId);
  const erAdmin = erAdministrator(jeg);

  let innhold = children;
  if (innstillinger.vedlikehold && !erAdmin) {
    // Ingen av sidene rendres. «Velg deg selv» blir stående, ellers kommer ingen tilbake som administrator.
    innhold = (
      <main className="page-shell">
        <section className="panel vedlikehold-side">
          <p className="eyebrow">Vedlikehold</p>
          <h1>Vaktlista er ikke tilgjengelig akkurat nå</h1>
          <p className="vedlikehold-tekst">{innstillinger.melding}</p>
          <IdentitetsVelger
            valg={ansatte.map(({ id, name }) => ({ id, name }))}
            valgtId={jeg?.id ?? null}
          />
        </section>
      </main>
    );
  } else if (innstillinger.vedlikehold) {
    innhold = (
      <>
        <div className="vedlikehold-band" role="status">
          <strong>Vedlikehold er på.</strong> Bare administratorer ser vaktlista nå. Meldingen til de andre:{" "}
          «{innstillinger.melding}»
        </div>
        {children}
      </>
    );
  }

  return (
    <html
      lang="nb"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Designmanualen: sidestilt logo på nett, minst 75 px høy, fri sone rundt. */}
        <div className="logo-band">
          <div className="logo-indre">
            <Link href="/" className="logo-lenke">
              <Image src="/vestfold-logo.svg" alt="Vestfold fylkeskommune" width={226} height={75} preload />
            </Link>
            <Figur />
          </div>
        </div>
        {innhold}
      </body>
    </html>
  );
}
