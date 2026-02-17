import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function QuizList() {
  // TODO: Fetch and display quizzes
  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">List of quizzes will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
