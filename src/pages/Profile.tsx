import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, Image, Save, Loader2, AlertCircle, GraduationCap, Building2, Calendar, Users, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
const SECTIONS = ["A", "B", "C", "D", "E", "F"];
const DEPARTMENTS = ["CSE", "ECE", "ME", "CE", "EE", "IT", "AE", "Other"];

export default function Profile() {
  const { user, profile, role, updateProfile, isLoading } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [email, setEmail] = useState(profile?.email || user?.email || "");
  const [regno, setRegno] = useState(profile?.regno || "");
  const [facultyId, setFacultyId] = useState(profile?.faculty_id || "");
  const [year, setYear] = useState(profile?.year || "");
  const [section, setSection] = useState(profile?.section || "");
  const [dept, setDept] = useState(profile?.dept || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || user?.email || "");
      setRegno(profile.regno || "");
      setFacultyId(profile.faculty_id || "");
      setYear(profile.year || "");
      setSection(profile.section || "");
      setDept(profile.dept || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile, user]);

  const handleSave = async () => {
    setSaving(true);
    
    let finalAvatarUrl = avatarUrl;
    
    // Upload image if a new file is selected
    if (selectedFile) {
      const uploadedUrl = await uploadAvatar(selectedFile);
      if (uploadedUrl) {
        finalAvatarUrl = uploadedUrl;
        setAvatarUrl(uploadedUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        setSaving(false);
        return; // Don't save if upload failed
      }
    }
    
    const updateData: any = {
      full_name: fullName,
      phone,
      email: email || user?.email,
      avatar_url: finalAvatarUrl,
      year,
      section,
      dept,
    };

    // Add role-specific fields
    if (role === "student") {
      updateData.regno = regno;
    } else if (role === "faculty") {
      updateData.faculty_id = facultyId;
    }

    const { error } = await updateProfile(updateData);
    setSaving(false);
    
    if (error) {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Success!", 
        description: "Your profile has been updated successfully." 
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      setUploading(true);
      
      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        // If bucket doesn't exist, create it first
        if (uploadError.message.includes("Bucket not found")) {
          toast({
            title: "Storage setup required",
            description: "Please create an 'avatars' bucket in Supabase Storage. See the setup guide.",
            variant: "destructive",
          });
        } else {
          throw uploadError;
        }
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            <div className="text-muted-foreground">Loading your profile...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full border-2 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>Not Signed In</CardTitle>
              <CardDescription>Please sign in to view and edit your profile.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Profile Settings</h1>
              <p className="text-lg text-muted-foreground mt-1">
                Manage your personal information and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Avatar Section */}
          <Card className="border-2 shadow-lg md:col-span-1">
            <CardContent className="p-6 flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-xl">
                  <AvatarImage src={previewUrl || avatarUrl || undefined} alt={fullName || "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-3xl font-bold">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg">{fullName || "User"}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Form Section */}
          <Card className="border-2 shadow-lg md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input 
                  id="fullName"
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-12 text-base border-2 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input 
                  id="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 text-base border-2 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input 
                  id="phone"
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="h-12 text-base border-2 focus:border-primary"
                />
              </div>

              {/* Role-specific fields */}
              {role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="regno" className="text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Registration Number
                  </Label>
                  <Input 
                    id="regno"
                    value={regno} 
                    onChange={e => setRegno(e.target.value)}
                    placeholder="Enter your registration number"
                    className="h-12 text-base border-2 focus:border-primary"
                  />
                </div>
              )}

              {role === "faculty" && (
                <div className="space-y-2">
                  <Label htmlFor="facultyId" className="text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Faculty ID
                  </Label>
                  <Input 
                    id="facultyId"
                    value={facultyId} 
                    onChange={e => setFacultyId(e.target.value)}
                    placeholder="Enter your faculty ID"
                    className="h-12 text-base border-2 focus:border-primary"
                  />
                </div>
              )}

              {role === "student" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Year
                    </Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger className="h-12 text-base border-2 focus:border-primary">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dept" className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Department
                    </Label>
                    <Select value={dept} onValueChange={setDept}>
                      <SelectTrigger className="h-12 text-base border-2 focus:border-primary">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section" className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Section
                    </Label>
                    <Select value={section} onValueChange={setSection}>
                      <SelectTrigger className="h-12 text-base border-2 focus:border-primary">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="avatarUpload" className="text-sm font-semibold flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Profile Picture
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="avatarUpload"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || saving}
                      className="flex-1 h-12 text-base border-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedFile ? "Change Image" : "Upload Image"}
                    </Button>
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveImage}
                        disabled={uploading || saving}
                        className="h-12 w-12"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {selectedFile && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
