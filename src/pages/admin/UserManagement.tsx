import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Role = "admin" | "faculty" | "student";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
const SECTIONS = ["A", "B", "C", "D", "E", "F"];
const DEPARTMENTS = ["CSE", "ECE", "ME", "CE", "EE", "IT", "AE", "Other"];

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  phone: string | null;
  regno: string | null;
  faculty_id: string | null;
  year: string | null;
  section: string | null;
  dept: string | null;
  created_at: string;
}

export default function UserManagement() {
  const { role: userRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for creating user
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "student" as Role,
    phone: "",
    regno: "",
    faculty_id: "",
    year: "",
    section: "",
    dept: "",
  });

  useEffect(() => {
    if (userRole === "admin") {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role as Role]) || []);

      const usersWithRoles: User[] = (profiles || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email || "",
        full_name: profile.full_name,
        role: roleMap.get(profile.id) || "student",
        phone: profile.phone,
        regno: profile.regno || null,
        faculty_id: profile.faculty_id || null,
        year: profile.year || null,
        section: profile.section || null,
        dept: profile.dept || null,
        created_at: profile.created_at,
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create user using signUp (works with anon key)
      // Note: This creates the user and triggers handle_new_user() which creates profile and assigns 'student' role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone || null,
            regno: formData.regno || null,
            faculty_id: formData.faculty_id || null,
            year: formData.year || null,
            section: formData.section || null,
            dept: formData.dept || null,
          },
        },
      });

      if (authError) {
        // Handle specific errors
        if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
          toast.error("A user with this email already exists");
          return;
        }
        throw authError;
      }

      if (authData?.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500));

        // Auto-confirm the user's email (so they can log in immediately)
        // Note: This function must be created by running the migration: supabase/migrations/20250102_auto_confirm_admin_users.sql
        const { error: confirmError } = await supabase.rpc('auto_confirm_user_email' as any, {
          p_user_id: authData.user.id
        });

        if (confirmError) {
          console.error("Email confirmation error:", confirmError);
          // Continue anyway - user might already be confirmed or function might not exist yet
          toast.warning("User created but email confirmation may be required. Please run the migration: supabase/migrations/20250102_auto_confirm_admin_users.sql");
        }

        // Update profile with additional fields (in case trigger didn't capture all metadata)
        // Use upsert to handle case where profile might not exist yet
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            regno: formData.regno || null,
            faculty_id: formData.faculty_id || null,
            year: formData.year || null,
            section: formData.section || null,
            dept: formData.dept || null,
          }, {
            onConflict: "id"
          });

        if (profileError) {
          console.error("Profile update error:", profileError);
          // Continue anyway - profile might have been created by trigger with different data
        }

        // Update user role (the trigger sets it to 'student' by default, we need to change it)
        // First delete the existing role, then insert the new one
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", authData.user.id);
        
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: formData.role,
          });

        if (roleError) {
          console.error("Role update error:", roleError);
          throw roleError;
        }

        toast.success("User created successfully and can log in immediately");
        setIsCreateDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        toast.error("User creation failed - no user data returned");
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleUpdateRole = async (userId: string, newRole: Role) => {
    try {
      // Delete existing role first, then insert new one
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: newRole,
        });

      if (error) throw error;

      toast.success("User role updated successfully");
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      // Delete from auth (requires admin API)
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        toast.error(
          "User deletion requires admin privileges. Please delete from Supabase Dashboard."
        );
        return;
      }

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      full_name: "",
      role: "student",
      phone: "",
      regno: "",
      faculty_id: "",
      year: "",
      section: "",
      dept: "",
    });
  };

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "faculty":
        return "default";
      case "student":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (userRole !== "admin") {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto max-w-7xl">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">You need admin privileges to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and their roles</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account. The user will be able to log in immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          placeholder="John Doe"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="+1234567890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    {formData.role === "student" && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="regno">Registration Number</Label>
                          <Input
                            id="regno"
                            placeholder="STU001"
                            value={formData.regno}
                            onChange={(e) => setFormData({ ...formData, regno: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="year">Year</Label>
                            <Select
                              value={formData.year}
                              onValueChange={(value) => setFormData({ ...formData, year: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                {YEARS.map((y) => (
                                  <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="dept">Department</Label>
                            <Select
                              value={formData.dept}
                              onValueChange={(value) => setFormData({ ...formData, dept: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {DEPARTMENTS.map((d) => (
                                  <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="section">Section</Label>
                            <Select
                              value={formData.section}
                              onValueChange={(value) => setFormData({ ...formData, section: value })}
                            >
                              <SelectTrigger>
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
                      </>
                    )}
                    {formData.role === "faculty" && (
                      <div className="grid gap-2">
                        <Label htmlFor="faculty_id">Faculty ID</Label>
                        <Input
                          id="faculty_id"
                          placeholder="FAC001"
                          value={formData.faculty_id}
                          onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create User
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleUpdateRole(user.id, value as Role)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="faculty">Faculty</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{user.dept || "N/A"}</TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {user.role === "student" && user.regno && (
                              <div>Reg No: {user.regno}</div>
                            )}
                            {user.role === "faculty" && user.faculty_id && (
                              <div>Faculty ID: {user.faculty_id}</div>
                            )}
                            {user.year && <div>Year: {user.year}</div>}
                            {user.section && <div>Section: {user.section}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
