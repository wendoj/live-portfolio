import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { SoundingLine } from "@/components/depth/SoundingLine";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Guestbook } from "@/components/sections/Guestbook";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { WhalePass } from "@/components/sea/ZoneLife";

/**
 * The page is a dive: each section sits in a full-width zone band whose
 * colour runs from the zone above into its own (see .zone in globals.css),
 * so the water darkens continuously down to the seabed.
 */
export default function Home() {
  return (
    <>
      <Nav />
      <SoundingLine />
      <main id="main">
        <Hero />
        <div className="zone zone-sunlight">
          <About />
        </div>
        {/* overflow-x-clip: the whale swims in from beyond the right edge. */}
        <div className="zone zone-twilight relative overflow-x-clip">
          <WhalePass className="top-[38%]" />
          <Projects />
        </div>
        <div className="zone zone-midnight">
          <Guestbook />
        </div>
        <div className="zone zone-seabed">
          <Contact />
        </div>
      </main>
      <div className="bg-(--zone-4)">
        <Footer />
      </div>
    </>
  );
}
