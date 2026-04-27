import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import PageTransition from "@/components/PageTransition";
import BottomNav from "@/components/BottomNav";
import NotificationSchedulerHost from "@/components/NotificationSchedulerHost";
import OfflineBanner from "@/components/OfflineBanner";
import Index from "./pages/Index.tsx";
import QuranPage from "./pages/QuranPage.tsx";
import PracticePage from "./pages/PracticePage.tsx";
import AudioPage from "./pages/AudioPage.tsx";
import PrayerPage from "./pages/PrayerPage.tsx";
import PrayerTimesPage from "./pages/PrayerTimesPage.tsx";
import HifzDashboardPage from "./pages/HifzDashboardPage.tsx";
import HifzReviewPage from "./pages/HifzReviewPage.tsx";
import BookmarksPage from "./pages/BookmarksPage.tsx";
import QuranPlannerPage from "./pages/QuranPlannerPage.tsx";
import QiblaPage from "./pages/QiblaPage.tsx";
import TasbihPage from "./pages/TasbihPage.tsx";
import DuaPage from "./pages/DuaPage.tsx";
import HijriCalendarPage from "./pages/HijriCalendarPage.tsx";
import DailyAmalPage from "./pages/DailyAmalPage.tsx";
import HadithPage from "./pages/HadithPage.tsx";
import HadithCollectionPage from "./pages/HadithCollectionPage.tsx";
import HadithChapterPage from "./pages/HadithChapterPage.tsx";
import HadithPracticeSetupPage from "./pages/HadithPracticeSetupPage.tsx";
import QazaPage from "./pages/QazaPage.tsx";
import NotificationsPage from "./pages/NotificationsPage.tsx";
import AskPage from "./pages/AskPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import RecitationStatsPage from "./pages/RecitationStatsPage.tsx";
import TafsirComparePage from "./pages/TafsirComparePage.tsx";
import RequireAdmin from "@/components/admin/RequireAdmin";
import AdminShell from "@/components/admin/AdminShell";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.tsx";
import AdminRolesPage from "./pages/admin/AdminRolesPage.tsx";
import AdminContentPage from "./pages/admin/AdminContentPage.tsx";
import AdminRecitationPage from "./pages/admin/AdminRecitationPage.tsx";
import AdminAskPage from "./pages/admin/AdminAskPage.tsx";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage.tsx";
import AdminLogsPage from "./pages/admin/AdminLogsPage.tsx";
import AdminBrandingPage from "./pages/admin/AdminBrandingPage.tsx";
import AdminHomePage from "./pages/admin/AdminHomePage.tsx";
import AdminNavPage from "./pages/admin/AdminNavPage.tsx";
import AdminDailyContentPage from "./pages/admin/AdminDailyContentPage.tsx";
import AdminRecitersPage from "./pages/admin/AdminRecitersPage.tsx";
import AdminContentStringsPage from "./pages/admin/AdminContentStringsPage.tsx";
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
        <Route path="/hifz/review" element={<PageTransition><HifzReviewPage /></PageTransition>} />
        <Route path="/bookmarks" element={<PageTransition><BookmarksPage /></PageTransition>} />
        <Route path="/planner" element={<PageTransition><QuranPlannerPage /></PageTransition>} />
        <Route path="/qibla" element={<PageTransition><QiblaPage /></PageTransition>} />
        <Route path="/tasbih" element={<PageTransition><TasbihPage /></PageTransition>} />
        <Route path="/dua" element={<PageTransition><DuaPage /></PageTransition>} />
        <Route path="/hijri" element={<PageTransition><HijriCalendarPage /></PageTransition>} />
        <Route path="/daily-amal" element={<PageTransition><DailyAmalPage /></PageTransition>} />
        <Route path="/hadith" element={<PageTransition><HadithPage /></PageTransition>} />
        <Route path="/hadith/practice" element={<PageTransition><HadithPracticeSetupPage /></PageTransition>} />
        <Route path="/hadith/:collection" element={<PageTransition><HadithCollectionPage /></PageTransition>} />
        <Route path="/hadith/:collection/:chapter" element={<PageTransition><HadithChapterPage /></PageTransition>} />
        <Route path="/qaza" element={<PageTransition><QazaPage /></PageTransition>} />
        <Route path="/notifications" element={<PageTransition><NotificationsPage /></PageTransition>} />
        <Route path="/ask" element={<PageTransition><AskPage /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/account" element={<PageTransition><AccountPage /></PageTransition>} />
        <Route path="/recitation/stats" element={<PageTransition><RecitationStatsPage /></PageTransition>} />
        <Route path="/tafsir/:surah/:ayah" element={<PageTransition><TafsirComparePage /></PageTransition>} />
        <Route path="/admin" element={<RequireAdmin><AdminShell /></RequireAdmin>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="roles" element={<AdminRolesPage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route path="recitation" element={<AdminRecitationPage />} />
          <Route path="ask" element={<AdminAskPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="logs" element={<AdminLogsPage />} />
          <Route path="branding" element={<AdminBrandingPage />} />
          <Route path="home" element={<AdminHomePage />} />
          <Route path="navigation" element={<AdminNavPage />} />
          <Route path="daily" element={<AdminDailyContentPage />} />
          <Route path="reciters" element={<AdminRecitersPage />} />
          <Route path="strings" element={<AdminContentStringsPage />} />
        </Route>
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
            <AuthProvider>
              <NotificationSchedulerHost />
              <OfflineBanner />
              <div className="pb-14">
                <AnimatedRoutes />
              </div>
              <BottomNav />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
