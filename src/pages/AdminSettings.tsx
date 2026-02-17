import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Settings, Save, Loader2, Mail, Globe, Users, Lock, Bell, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  defaultUserRole: string;
  emailNotifications: boolean;
  maxFileUploadSize: number;
  sessionTimeout: number;
  allowPublicCourses: boolean;
  requireEmailVerification: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "VIDHYA HUB",
  siteDescription: "Your learning platform",
  contactEmail: "",
  supportEmail: "",
  maintenanceMode: false,
  registrationEnabled: true,
  defaultUserRole: "student",
  emailNotifications: true,
  maxFileUploadSize: 5,
  sessionTimeout: 30,
  allowPublicCourses: true,
  requireEmailVerification: false,
};

export default function AdminSettings() {
  const { role } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (role === "admin") {
      fetchSettings();
    }
  }, [role]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "site_name",
          "site_description",
          "contact_email",
          "support_email",
          "maintenance_mode",
          "registration_enabled",
          "default_user_role",
          "email_notifications",
          "max_file_upload_size",
          "session_timeout",
          "allow_public_courses",
          "require_email_verification",
        ]);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      const loadedSettings = { ...DEFAULT_SETTINGS };

      if (data && data.length > 0) {
        data.forEach((item) => {
          const key = item.key;
          // Handle JSONB value - it might be a string or already parsed
          let value = item.value;
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch {
              // If parsing fails, use as-is
            }
          }

          switch (key) {
            case "site_name":
              loadedSettings.siteName = typeof value === 'string' ? value : (value?.toString() || DEFAULT_SETTINGS.siteName);
              break;
            case "site_description":
              loadedSettings.siteDescription = typeof value === 'string' ? value : (value?.toString() || DEFAULT_SETTINGS.siteDescription);
              break;
            case "contact_email":
              loadedSettings.contactEmail = typeof value === 'string' ? value : "";
              break;
            case "support_email":
              loadedSettings.supportEmail = typeof value === 'string' ? value : "";
              break;
            case "maintenance_mode":
              loadedSettings.maintenanceMode = typeof value === 'boolean' ? value : (value === 'true' || value === true || DEFAULT_SETTINGS.maintenanceMode);
              break;
            case "registration_enabled":
              loadedSettings.registrationEnabled = typeof value === 'boolean' ? value : (value === 'true' || value === true || DEFAULT_SETTINGS.registrationEnabled);
              break;
            case "default_user_role":
              loadedSettings.defaultUserRole = typeof value === 'string' ? value : (value?.toString() || DEFAULT_SETTINGS.defaultUserRole);
              break;
            case "email_notifications":
              loadedSettings.emailNotifications = typeof value === 'boolean' ? value : (value === 'true' || value === true || DEFAULT_SETTINGS.emailNotifications);
              break;
            case "max_file_upload_size":
              loadedSettings.maxFileUploadSize = typeof value === 'number' ? value : (parseInt(value?.toString() || '0') || DEFAULT_SETTINGS.maxFileUploadSize);
              break;
            case "session_timeout":
              loadedSettings.sessionTimeout = typeof value === 'number' ? value : (parseInt(value?.toString() || '0') || DEFAULT_SETTINGS.sessionTimeout);
              break;
            case "allow_public_courses":
              loadedSettings.allowPublicCourses = typeof value === 'boolean' ? value : (value === 'true' || value === true || DEFAULT_SETTINGS.allowPublicCourses);
              break;
            case "require_email_verification":
              loadedSettings.requireEmailVerification = typeof value === 'boolean' ? value : (value === 'true' || value === true || DEFAULT_SETTINGS.requireEmailVerification);
              break;
          }
        });
      }

      setSettings(loadedSettings);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load settings. Using defaults.",
        variant: "destructive",
      });
      // Still set default settings even on error
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const settingsToSave = [
        { key: "site_name", value: settings.siteName },
        { key: "site_description", value: settings.siteDescription },
        { key: "contact_email", value: settings.contactEmail },
        { key: "support_email", value: settings.supportEmail },
        { key: "maintenance_mode", value: settings.maintenanceMode },
        { key: "registration_enabled", value: settings.registrationEnabled },
        { key: "default_user_role", value: settings.defaultUserRole },
        { key: "email_notifications", value: settings.emailNotifications },
        { key: "max_file_upload_size", value: settings.maxFileUploadSize },
        { key: "session_timeout", value: settings.sessionTimeout },
        { key: "allow_public_courses", value: settings.allowPublicCourses },
        { key: "require_email_verification", value: settings.requireEmailVerification },
      ];

      // Save each setting individually
      const errors: string[] = [];
      
      for (const setting of settingsToSave) {
        try {
          // Try to update first
          const { data: existing, error: selectError } = await supabase
            .from("site_settings")
            .select("id")
            .eq("key", setting.key)
            .maybeSingle();

          if (selectError && selectError.code !== 'PGRST116') {
            console.error(`Error checking ${setting.key}:`, selectError);
            errors.push(`${setting.key}: ${selectError.message}`);
            continue;
          }

          if (existing) {
            // Update existing
            const { error: updateError } = await supabase
              .from("site_settings")
              .update({
                value: setting.value,
                updated_at: new Date().toISOString(),
              })
              .eq("key", setting.key);

            if (updateError) {
              console.error(`Error updating ${setting.key}:`, updateError);
              errors.push(`${setting.key}: ${updateError.message}`);
            }
          } else {
            // Insert new
            const { error: insertError } = await supabase
              .from("site_settings")
              .insert({
                key: setting.key,
                value: setting.value,
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              console.error(`Error inserting ${setting.key}:`, insertError);
              errors.push(`${setting.key}: ${insertError.message}`);
            }
          }
        } catch (err: any) {
          console.error(`Error processing ${setting.key}:`, err);
          errors.push(`${setting.key}: ${err.message || 'Unknown error'}`);
        }
      }

      if (errors.length > 0) {
        throw new Error(`Failed to save some settings: ${errors.join(', ')}`);
      }

      toast({
        title: "Success!",
        description: "All settings have been saved successfully.",
      });

      // Reload settings to confirm they were saved
      await fetchSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (role !== "admin") {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You need admin privileges to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Admin Settings</h1>
            <p className="text-lg text-muted-foreground mt-1">Manage platform configuration and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Configure basic site information and behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    placeholder="Enter site name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    placeholder="Enter site description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    placeholder="support@example.com"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="maxFileUploadSize">Max File Upload Size (MB)</Label>
                  <Input
                    id="maxFileUploadSize"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxFileUploadSize}
                    onChange={(e) => setSettings({ ...settings, maxFileUploadSize: parseInt(e.target.value) || 5 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Put the site in maintenance mode</p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowPublicCourses">Allow Public Courses</Label>
                    <p className="text-sm text-muted-foreground">Allow creation of public courses</p>
                  </div>
                  <Switch
                    id="allowPublicCourses"
                    checked={settings.allowPublicCourses}
                    onCheckedChange={(checked) => setSettings({ ...settings, allowPublicCourses: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Settings */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Settings
                </CardTitle>
                <CardDescription>Configure user registration and default roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="registrationEnabled">Registration Enabled</Label>
                    <p className="text-sm text-muted-foreground">Allow new users to register</p>
                  </div>
                  <Switch
                    id="registrationEnabled"
                    checked={settings.registrationEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultUserRole">Default User Role</Label>
                  <Select
                    value={settings.defaultUserRole}
                    onValueChange={(value) => setSettings({ ...settings, defaultUserRole: value })}
                  >
                    <SelectTrigger id="defaultUserRole">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Role assigned to new users upon registration</p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">Require users to verify their email before accessing the platform</p>
                  </div>
                  <Switch
                    id="requireEmailVerification"
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
                  />
                  <p className="text-sm text-muted-foreground">Time before user session expires due to inactivity</p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">Enforce email verification for new accounts</p>
                  </div>
                  <Switch
                    id="requireEmailVerification"
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
                  />
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Security Recommendations</p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Enable email verification for better security</li>
                        <li>Set appropriate session timeout values</li>
                        <li>Regularly review user access and permissions</li>
                        <li>Keep the platform updated with latest security patches</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure email and notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable email notifications for platform events</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    placeholder="contact@example.com"
                  />
                  <p className="text-sm text-muted-foreground">Email address for general inquiries</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    placeholder="support@example.com"
                  />
                  <p className="text-sm text-muted-foreground">Email address for technical support</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button - Fixed at bottom */}
        <div className="sticky bottom-0 bg-background border-t pt-4 pb-4 z-10">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Make sure to save your changes before leaving this page.
                </p>
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="min-w-[120px]"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save All Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
