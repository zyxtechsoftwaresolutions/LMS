import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ModuleEdit() {
  // TODO: Form for creating/editing a module
  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Module</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Module creation/edit form will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
