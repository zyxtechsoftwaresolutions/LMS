import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Logs() {
  // TODO: View logs
  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">System logs will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
