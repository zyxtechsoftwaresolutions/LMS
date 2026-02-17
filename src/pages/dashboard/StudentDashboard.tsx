import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function StudentDashboard() {
  // TODO: Display enrolled courses, progress percent, recent quiz results
  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Student Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Enrolled courses, progress, and quiz results will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
