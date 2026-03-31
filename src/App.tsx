import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index.tsx";
import QuranPage from "./pages/QuranPage.tsx";
import PracticePage from "./pages/PracticePage.tsx";
import AudioPage from "./pages/AudioPage.tsx";
import PrayerPage from "./pages/PrayerPage.tsx";
import PrayerTimesPage from "./pages/PrayerTimesPage.tsx";
import HifzDashboardPage from "./pages/HifzDashboardPage.tsx";
import BookmarksPage from "./pages/BookmarksPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/quran" element={<QuranPage />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/audio" element={<AudioPage />} />
              <Route path="/prayer" element={<PrayerPage />} />
              <Route path="/prayer-times" element={<PrayerTimesPage />} />
              <Route path="/hifz" element={<HifzDashboardPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
