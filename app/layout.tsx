import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { after } from "next/server";
import { Figur } from "@/components/figur/Figur";
import { Konto } from "@/components/Konto";
import { erAdministrator, lokalModus } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { synkHvisForfalt } from "@/lib/synk";
import { innlogget } from "@/lib/utfor";
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
  description: "Uke, måned og ansatt-katalog for teamene i Digital støtte, Vestfold fylkeskommune.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // `innlogget()` leser kapselen først: da er siden dynamisk, og `next build` leser aldri databasen (Fase 43).
  const jeg = await innlogget();
  const { innstillinger, synk } = lesVaktliste();
  // Ingen tidsplanlegger på serveren: en forfalt synk kjøres etter at siden er sendt, og vises ved neste lasting.
  after(() => synkHvisForfalt(synk));
  const erAdmin = erAdministrator(jeg);

  let innhold = children;
  // Den som ikke er innlogget, får sidene (som sender til innlogging), så en administrator alltid kan
  // logge inn under vedlikehold. Innloggede uten admin får meldingen.
  if (innstillinger.vedlikehold && !erAdmin && (jeg || lokalModus())) {
    innhold = (
      <main className="page-shell">
        <section className="panel vedlikehold-side">
          <p className="eyebrow">Vedlikehold</p>
          <h1>Vaktlista er ikke tilgjengelig akkurat nå</h1>
          <p className="vedlikehold-tekst">{innstillinger.melding}</p>
          <Konto jeg={jeg} />
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
      // Fargene er validert som #rrggbb før de lagres. Uten egen farge gjelder `:root` i globals.css;
      // fyllet slås på av `data-idag-fyll`, så rutene beholder sin egen bakgrunn når ingen fyll er valgt.
      data-idag-fyll={innstillinger.idagFyll ? "" : undefined}
      style={
        {
          ...(innstillinger.idagFarge ? { "--idag-ramme": innstillinger.idagFarge } : {}),
          ...(innstillinger.idagFyll ? { "--idag-fyll": innstillinger.idagFyll } : {}),
        } as React.CSSProperties
      }
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
