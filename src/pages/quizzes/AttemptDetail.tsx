import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AttemptDetail() {
  // TODO: Display attempt details, status, grading
  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Attempt Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Attempt details and grading will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
