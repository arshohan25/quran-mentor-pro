import { MessageCircleQuestion, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminAskPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Q&A Logs</h1>
        <p className="text-sm text-muted-foreground">Monitor the islamic-qa edge function.</p>
      </div>

      <div className="rounded-xl border bg-card p-8 text-center space-y-3">
        <MessageCircleQuestion className="w-10 h-10 text-muted-foreground mx-auto" />
        <div>
          <p className="text-sm font-semibold text-foreground">Edge function logs live in Cloud</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Detailed request, response, and error logs for the AI Q&A function are available in
            Lovable Cloud → Functions → islamic-qa.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="https://lovable.dev/projects" target="_blank" rel="noreferrer">
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open Cloud Logs
          </a>
        </Button>
      </div>
    </div>
  );
}
