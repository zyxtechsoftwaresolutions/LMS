import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SiteSettings() {
  // TODO: Manage site settings, categories, tags
  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Site Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Site settings, categories, and tags management will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
