import Navbar from './components/Navbar'
import Hero from './components/Hero'
import QASection from './components/QASection'
import PlaybookSection from './components/PlaybookSection'
import TechStackSection from './components/TechStackSection'
import ResourcesSection from './components/ResourcesSection'
import CommunitySection from './components/CommunitySection'
import Footer from './components/Footer'
import SectionDivider from './components/SectionDivider'
import ScrollToTop from './components/ScrollToTop'
import SmoothScrollProvider from './components/SmoothScrollProvider'
import ScrollProgressRail from './components/ScrollProgressRail'
import SituationPicker from './components/SituationPicker'
import FrameworkSpotlight from './components/FrameworkSpotlight'
import ScrollAtmosphere from './components/ScrollAtmosphere'
import ParallaxManifesto from './components/ParallaxManifesto'
import WorkshopVideoSection from './components/WorkshopVideoSection'

export default function App() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-navy-900 transition-colors duration-300">
        <ScrollAtmosphere />
        <Navbar />
        <ScrollProgressRail />
        <Hero />
        <SectionDivider variant="accent" />
        <ParallaxManifesto />
        <SectionDivider />
        <WorkshopVideoSection />
        <SectionDivider variant="accent" />
        <SituationPicker />
        <SectionDivider />
        <QASection />
        <FrameworkSpotlight />
        <SectionDivider />
        <PlaybookSection />
        <SectionDivider variant="accent" />
        <TechStackSection />
        <SectionDivider />
        <ResourcesSection />
        <SectionDivider variant="accent" />
        <CommunitySection />
        <Footer />
        <ScrollToTop />
      </div>
    </SmoothScrollProvider>
  )
}
