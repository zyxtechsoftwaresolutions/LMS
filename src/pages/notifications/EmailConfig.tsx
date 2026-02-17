import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function EmailConfig() {
  // TODO: Form for configuring email (SMTP/Supabase)
  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Email configuration form will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
