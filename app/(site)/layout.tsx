import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu" className="skip">Aller au contenu</a>
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
    </>
  );
}
