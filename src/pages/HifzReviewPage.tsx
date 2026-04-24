import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ReviewSession from "@/components/hifz/ReviewSession";

export default function HifzReviewPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <ReviewSession />;
}
