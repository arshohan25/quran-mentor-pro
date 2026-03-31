import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index.tsx";
import QuranPage from "./pages/QuranPage.tsx";
import PracticePage from "./pages/PracticePage.tsx";
import AudioPage from "./pages/AudioPage.tsx";
import PrayerPage from "./pages/PrayerPage.tsx";
import PrayerTimesPage from "./pages/PrayerTimesPage.tsx";
import HifzDashboardPage from "./pages/HifzDashboardPage.tsx";
import BookmarksPage from "./pages/BookmarksPage.tsx";
import QuranPlannerPage from "./pages/QuranPlannerPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/quran" element={<PageTransition><QuranPage /></PageTransition>} />
        <Route path="/practice" element={<PageTransition><PracticePage /></PageTransition>} />
        <Route path="/audio" element={<PageTransition><AudioPage /></PageTransition>} />
        <Route path="/prayer" element={<PageTransition><PrayerPage /></PageTransition>} />
        <Route path="/prayer-times" element={<PageTransition><PrayerTimesPage /></PageTransition>} />
        <Route path="/hifz" element={<PageTransition><HifzDashboardPage /></PageTransition>} />
        <Route path="/bookmarks" element={<PageTransition><BookmarksPage /></PageTransition>} />
        <Route path="/planner" element={<PageTransition><QuranPlannerPage /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
