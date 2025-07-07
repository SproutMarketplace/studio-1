
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react"; 
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Mail, Lock, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, signInWithGooglePopup, db } from "@/lib/firebase"; 
import { signInWithEmailAndPassword } from "firebase/auth"; 
import { useAuth } from "@/contexts/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { logoutUser } from "@/lib/firestoreService";

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);


const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshUserProfile } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    form.clearErrors();
    if (!auth) {
        toast({
            variant: "destructive",
            title: "Offline Mode",
            description: "Cannot log in while in offline mode. Please configure Firebase keys.",
        });
        return;
    }
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      await refreshUserProfile();
      toast({
        title: "Login Successful!",
        description: "Welcome back! Redirecting to the catalog...",
      });
      router.push("/catalog");
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/invalid-credential":
            errorMessage = "Invalid email or password. Please try again.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address is not valid.";
            break;
          case "auth/user-disabled":
            errorMessage = "This user account has been disabled.";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    if (!auth || !db) {
        toast({
            variant: "destructive",
            title: "Offline Mode",
            description: "Cannot log in while in offline mode. Please configure Firebase keys.",
        });
        setIsGoogleLoading(false);
        return;
    }
    try {
      const userCredential = await signInWithGooglePopup();
      const user = userCredential.user;

      // Check if user has a profile document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // This Google account is not associated with an existing user profile in our app.
        // We must sign them out and instruct them to sign up first.
        await logoutUser();
        toast({
          variant: "destructive",
          title: "No Account Found",
          description: "No account exists with this Google account. Please sign up first.",
        });
      } else {
        // User profile exists, this is a valid login.
        await refreshUserProfile();
        toast({
          title: "Google Sign-In Successful!",
          description: "Welcome! Redirecting to the catalog...",
        });
        router.push("/catalog");
      }
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      let errorMessage = "An unexpected error occurred with Google Sign-In. Please try again.";
       if (error.code) {
        switch (error.code) {
          case "auth/popup-closed-by-user":
            // This is a normal user action, so we don't show an error toast.
            return;
          case "auth/account-exists-with-different-credential":
            errorMessage = "An account already exists with this email address using a different sign-in method. Try signing in with your original method.";
            break;
          case "auth/popup-blocked":
            errorMessage = "Popup blocked by browser. Please allow popups for this site and try again.";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: errorMessage,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Welcome Back!</h1>
            <p className="text-muted-foreground">Sign in to continue to Sprout.</p>
        </div>
      
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="you@example.com" {...field} className="pl-10 text-base" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                   <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••" {...field} className="pl-10 text-base" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full text-lg py-3 mt-6" disabled={form.formState.isSubmitting || isGoogleLoading}>
              {form.formState.isSubmitting ? "Signing In..." : (
                <>
                  <LogIn className="mr-2 h-5 w-5" /> Sign In
                </>
              )}
            </Button>
          </form>
        </Form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full text-lg py-3" 
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || form.formState.isSubmitting}
        >
          {isGoogleLoading ? "Signing In..." : (
            <>
              <GoogleLogo /> 
              <span className="ml-2">Sign in with Google</span>
            </>
          )}
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 hover:underline">
                Sign Up
            </Link>
        </p>
    </div>
  );
}
