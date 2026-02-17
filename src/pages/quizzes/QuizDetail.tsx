import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function QuizDetail() {
  // TODO: Fetch and display quiz details, questions, attempts
  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Quiz details, questions, and attempts will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
