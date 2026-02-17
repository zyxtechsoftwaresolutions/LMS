import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CourseList() {
  // TODO: Fetch and display courses
  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">List of courses will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
