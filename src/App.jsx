import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FluidBackground from './components/layout/FluidBackground';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTopButton from './components/common/ScrollToTopButton';
import HomePage from './pages/HomePage';
import TimelinePage from './pages/TimelinePage';
import EpisodesPage from './pages/EpisodesPage';
import EpisodeDetailPage from './pages/EpisodeDetailPage';
import CharactersPage from './pages/CharactersPage';
import CharacterDetailPage from './pages/CharacterDetailPage';
import SeasonsPage from './pages/SeasonsPage';
import InvestigationPage from './pages/InvestigationPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Root Application Component mounting the global FluidBackground behind the
 * sticky Navbar, routed page views (including the custom 404 catch-all route),
 * Floating ScrollToTopButton, and Footer.
 */
export default function App() {
  return (
    <div className="relative min-h-screen flex flex-col bg-transparent text-zinc-100">
      <FluidBackground />
      <Navbar />
      <main className="relative z-10 flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/episodes" element={<EpisodesPage />} />
          <Route path="/episodes/:id" element={<EpisodeDetailPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/characters/:id" element={<CharacterDetailPage />} />
          <Route path="/seasons" element={<SeasonsPage />} />
          <Route path="/investigation" element={<InvestigationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <ScrollToTopButton />
      <Footer />
    </div>
  );
}
