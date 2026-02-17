import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Loader2, Save, Plus, Edit, Trash2, BookOpen, Upload, X, Image } from "lucide-react";
import { toast } from "sonner";

export default function CourseEdit() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isNew = !id;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnail_url: "",
    visibility: "public" as "public" | "private" | "targeted",
    video_url: "",
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState("");
  const [targetingOptions, setTargetingOptions] = useState({
    years: [] as string[],
    sections: [] as string[],
    departments: [] as string[],
  });
  const [steps, setSteps] = useState<any[]>([]);

  // Options for dropdowns
  const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const sectionOptions = ["A", "B", "C", "D", "E", "F"];
  const departmentOptions = ["CSE", "ECE", "ME", "CE", "EEE", "IT"];

  useEffect(() => {
    if (!isNew && id) {
      fetchCourse();
      fetchSteps();
    }
  }, [id, isNew]);

  const fetchSteps = async () => {
    if (!id) return;
    try {
      const { data: modules } = await supabase
        .from("modules")
        .select("id, title, position")
        .eq("course_id", id)
        .order("position");

      setSteps(modules || []);
    } catch (error) {
      console.error("Error fetching steps:", error);
    }
  };

  useEffect(() => {
    if (role && role !== "faculty" && role !== "admin") {
      toast.error("You don't have permission to create courses");
      navigate("/dashboard");
    }
  }, [role, navigate]);

  const fetchCourse = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          thumbnail_url: data.thumbnail_url || "",
          visibility: (data.visibility as "public" | "private" | "targeted") || "public",
          video_url: (data as any).video_url || "",
          tags: data.tags || [],
        });
      }
    } catch (error: any) {
      console.error("Error fetching course:", error);
      toast.error(error.message || "Failed to load course");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    if (isNew) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(title) }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!formData.title || !formData.slug) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const courseData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description || null,
        thumbnail_url: formData.thumbnail_url || null,
        visibility: formData.visibility,
        video_url: formData.video_url || null,
        tags: formData.tags,
        instructor_id: user.id,
      };

      let courseId: string;

      if (isNew) {
        const { data, error } = await supabase
          .from("courses")
          .insert(courseData)
          .select()
          .single();

        if (error) throw error;
        courseId = data.id;
        toast.success("Course created successfully!");
      } else {
        const { error } = await supabase
          .from("courses")
          .update(courseData)
          .eq("id", id);

        if (error) throw error;
        courseId = id!;
        toast.success("Course updated successfully!");
      }

      // Handle targeted students if visibility is "targeted"
      if (formData.visibility === "targeted" && courseId) {
        // Check if any targeting criteria is selected
        const hasCriteria =
          targetingOptions.years.length > 0 ||
          targetingOptions.sections.length > 0 ||
          targetingOptions.departments.length > 0;

        if (!hasCriteria) {
          toast.warning("Please select at least one targeting criteria (year, section, or department)");
          setIsSaving(false);
          return;
        }

        // First, remove existing targeted students for this course
        await (supabase as any)
          .from("course_target_students")
          .delete()
          .eq("course_id", courseId);

        // Get all students
        const { data: studentRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "student");

        if (studentRoles && studentRoles.length > 0) {
          const studentIds = studentRoles.map((sr) => sr.user_id);

          // Get student profiles with their details
          const { data: allStudents, error: studentsError } = await supabase
            .from("profiles")
            .select("id, year, section, dept")
            .in("id", studentIds);

          if (!studentsError && allStudents) {
            // Filter students by criteria (OR logic - matches if any criteria matches)
            const matchingStudents = allStudents.filter((student: any) => {
              // Check if student matches any selected year
              const matchesYear =
                targetingOptions.years.length === 0 || targetingOptions.years.includes(student.year || "");

              // Check if student matches any selected section
              const matchesSection =
                targetingOptions.sections.length === 0 ||
                targetingOptions.sections.includes(student.section || "");

              // Check if student matches any selected department
              const matchesDept =
                targetingOptions.departments.length === 0 ||
                targetingOptions.departments.includes(student.dept || "");

              // Student matches if they satisfy at least one of the selected criteria groups
              // If a criteria group is empty, it's considered as "all" (always matches)
              return matchesYear && matchesSection && matchesDept;
            });

            if (matchingStudents.length > 0) {
              // Add matching students to course_target_students
              const targetStudents = matchingStudents.map((student: any) => ({
                course_id: courseId,
                student_id: student.id,
              }));

              const { error: targetError } = await (supabase as any)
                .from("course_target_students")
                .insert(targetStudents);

              if (targetError) {
                console.error("Error adding targeted students:", targetError);
                toast.warning("Course saved but failed to add targeted students");
              } else {
                toast.success(
                  `Course saved! Targeted ${matchingStudents.length} student(s)`
                );
              }
            } else {
              toast.warning("No students match the selected criteria");
            }
          }
        } else {
          toast.warning("No students found in the system");
        }
      }

      navigate(`/courses/${courseId}`);
    } catch (error: any) {
      console.error("Error saving course:", error);
      toast.error(error.message || "Failed to save course");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isNew ? "Create New Course" : "Edit Course"}</CardTitle>
            <CardDescription>
              {isNew
                ? "Fill in the details to create a new course"
                : "Update the course information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="title">
                  Course Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Introduction to Web Development"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">
                  URL Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  placeholder="introduction-to-web-development"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used in the course URL. Use lowercase letters, numbers, and hyphens.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Course description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) =>
                    setFormData({ ...formData, visibility: value as typeof formData.visibility })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can view</SelectItem>
                    <SelectItem value="private">Private - Only enrolled students</SelectItem>
                    <SelectItem value="targeted">Targeted - Specific students only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Targeting Options - Show when visibility is "targeted" */}
              {formData.visibility === "targeted" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Target Students</Label>
                    <p className="text-sm text-muted-foreground">
                      Select multiple criteria to target specific students. Students matching any selected criteria will have access.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Years - Multiple Checkboxes */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Years</Label>
                      <div className="space-y-2">
                        {yearOptions.map((year) => (
                          <div key={year} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`year-${year}`}
                              checked={targetingOptions.years.includes(year)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTargetingOptions({
                                    ...targetingOptions,
                                    years: [...targetingOptions.years, year],
                                  });
                                } else {
                                  setTargetingOptions({
                                    ...targetingOptions,
                                    years: targetingOptions.years.filter((y) => y !== year),
                                  });
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label
                              htmlFor={`year-${year}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {year}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sections - Multiple Checkboxes */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Sections</Label>
                      <div className="space-y-2">
                        {sectionOptions.map((section) => (
                          <div key={section} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`section-${section}`}
                              checked={targetingOptions.sections.includes(section)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTargetingOptions({
                                    ...targetingOptions,
                                    sections: [...targetingOptions.sections, section],
                                  });
                                } else {
                                  setTargetingOptions({
                                    ...targetingOptions,
                                    sections: targetingOptions.sections.filter((s) => s !== section),
                                  });
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label
                              htmlFor={`section-${section}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              Section {section}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Departments - Multiple Checkboxes */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Departments</Label>
                      <div className="space-y-2">
                        {departmentOptions.map((dept) => (
                          <div key={dept} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`dept-${dept}`}
                              checked={targetingOptions.departments.includes(dept)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTargetingOptions({
                                    ...targetingOptions,
                                    departments: [...targetingOptions.departments, dept],
                                  });
                                } else {
                                  setTargetingOptions({
                                    ...targetingOptions,
                                    departments: targetingOptions.departments.filter((d) => d !== dept),
                                  });
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label
                              htmlFor={`dept-${dept}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {dept}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {(targetingOptions.years.length > 0 ||
                    targetingOptions.sections.length > 0 ||
                    targetingOptions.departments.length > 0) && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium mb-1">Selected Criteria:</p>
                      <div className="text-sm text-muted-foreground">
                        {targetingOptions.years.length > 0 && (
                          <span>Years: {targetingOptions.years.join(", ")}</span>
                        )}
                        {targetingOptions.sections.length > 0 && (
                          <span className="ml-4">
                            Sections: {targetingOptions.sections.join(", ")}
                          </span>
                        )}
                        {targetingOptions.departments.length > 0 && (
                          <span className="ml-4">
                            Departments: {targetingOptions.departments.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="thumbnail">Course Thumbnail</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      id="thumbnail_url"
                      placeholder="Or enter thumbnail image URL"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground text-center">OR</div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail_upload" className="cursor-pointer">
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors">
                        {uploadingThumbnail ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Uploading...</span>
                          </div>
                        ) : thumbnailFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative w-full h-full flex items-center justify-center">
                              <img
                                src={URL.createObjectURL(thumbnailFile)}
                                alt="Thumbnail preview"
                                className="max-w-full max-h-28 object-contain rounded"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 bg-background/80 hover:bg-background"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setThumbnailFile(null);
                                  setFormData({ ...formData, thumbnail_url: "" });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(2)} KB)
                            </span>
                          </div>
                        ) : formData.thumbnail_url ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative w-full h-full flex items-center justify-center">
                              <img
                                src={formData.thumbnail_url}
                                alt="Thumbnail preview"
                                className="max-w-full max-h-28 object-contain rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">Current thumbnail</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Image className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Click to upload thumbnail or drag and drop
                            </span>
                            <span className="text-xs text-muted-foreground">
                              JPG, PNG, WebP (Max 5MB)
                            </span>
                          </div>
                        )}
                      </div>
                    </Label>
                    <input
                      type="file"
                      id="thumbnail_upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Check file size (5MB limit for images)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Thumbnail image size must be less than 5MB");
                          return;
                        }

                        // Check if it's an image
                        if (!file.type.startsWith("image/")) {
                          toast.error("Please select a valid image file");
                          return;
                        }

                        setThumbnailFile(file);
                        setUploadingThumbnail(true);

                        try {
                          // Generate unique filename
                          const fileExt = file.name.split(".").pop();
                          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                          const filePath = `course-thumbnails/${fileName}`;

                          // Upload to Supabase Storage (try images bucket first, then videos as fallback)
                          let uploadError = null;
                          let publicUrl = null;

                          // Try images bucket first
                          const { data: uploadData, error: imgError } = await supabase.storage
                            .from("images")
                            .upload(filePath, file, {
                              cacheControl: "3600",
                              upsert: false,
                            });

                          if (imgError && imgError.message.includes("Bucket not found")) {
                            // Fallback to videos bucket
                            const { data: fallbackUpload, error: fallbackError } = await supabase.storage
                              .from("videos")
                              .upload(filePath, file, {
                                cacheControl: "3600",
                                upsert: false,
                              });

                            if (fallbackError) {
                              throw fallbackError;
                            }

                            const { data: urlData } = supabase.storage
                              .from("videos")
                              .getPublicUrl(filePath);

                            publicUrl = urlData?.publicUrl;
                          } else if (imgError) {
                            throw imgError;
                          } else {
                            const { data: urlData } = supabase.storage
                              .from("images")
                              .getPublicUrl(filePath);

                            publicUrl = urlData?.publicUrl;
                          }

                          if (publicUrl) {
                            setFormData({ ...formData, thumbnail_url: publicUrl });
                            toast.success("Thumbnail uploaded successfully!");
                          } else {
                            throw new Error("Failed to get thumbnail URL");
                          }
                        } catch (error: any) {
                          console.error("Error uploading thumbnail:", error);
                          toast.error(error.message || "Failed to upload thumbnail");
                          setThumbnailFile(null);
                        } finally {
                          setUploadingThumbnail(false);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="video">Course Video</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      id="video_url"
                      placeholder="Or enter video URL (YouTube, Vimeo, or direct link)"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground text-center">OR</div>
                  <div className="space-y-2">
                    <Label htmlFor="video_upload" className="cursor-pointer">
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors">
                        {uploadingVideo ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Uploading...</span>
                          </div>
                        ) : videoFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{videoFile.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setVideoFile(null);
                                  setFormData({ ...formData, video_url: "" });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Click to upload video or drag and drop
                            </span>
                            <span className="text-xs text-muted-foreground">
                              MP4, WebM, MOV (Max 100MB)
                            </span>
                          </div>
                        )}
                      </div>
                    </Label>
                    <input
                      type="file"
                      id="video_upload"
                      accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Check file size (100MB limit)
                        if (file.size > 100 * 1024 * 1024) {
                          toast.error("Video file size must be less than 100MB");
                          return;
                        }

                        setVideoFile(file);
                        setUploadingVideo(true);

                        try {
                          // Generate unique filename
                          const fileExt = file.name.split(".").pop();
                          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                          const filePath = `course-videos/${fileName}`;

                          // Upload to Supabase Storage
                          const { data: uploadData, error: uploadError } = await supabase.storage
                            .from("videos")
                            .upload(filePath, file, {
                              cacheControl: "3600",
                              upsert: false,
                            });

                          if (uploadError) {
                            // If bucket doesn't exist, create it first
                            if (uploadError.message.includes("Bucket not found")) {
                              toast.error("Video storage bucket not found. Please create a 'videos' bucket in Supabase Storage.");
                              setVideoFile(null);
                              setUploadingVideo(false);
                              return;
                            }
                            throw uploadError;
                          }

                          // Get public URL
                          const { data: urlData } = supabase.storage
                            .from("videos")
                            .getPublicUrl(filePath);

                          if (urlData?.publicUrl) {
                            setFormData({ ...formData, video_url: urlData.publicUrl });
                            toast.success("Video uploaded successfully!");
                          } else {
                            throw new Error("Failed to get video URL");
                          }
                        } catch (error: any) {
                          console.error("Error uploading video:", error);
                          toast.error(error.message || "Failed to upload video");
                          setVideoFile(null);
                        } finally {
                          setUploadingVideo(false);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Course Steps Management - Only show when editing existing course */}
              {!isNew && id && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Course Steps</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage the step-by-step content for this course
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/courses/${id}/steps/new`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Step
                    </Button>
                  </div>

                  {steps.length > 0 ? (
                    <div className="space-y-2">
                      {steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{step.title}</div>
                              <div className="text-sm text-muted-foreground">Step {index + 1}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/courses/${id}/steps/${step.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg bg-muted/30">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No steps added yet</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`/courses/${id}/steps/new`)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Step
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {isNew ? "Create Course" : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
