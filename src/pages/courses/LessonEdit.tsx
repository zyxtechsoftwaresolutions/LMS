import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LessonEdit() {
  // TODO: Form for creating/editing a lesson (video, PDF, rich text, attachments)
  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Lesson creation/edit form will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
