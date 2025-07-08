
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import Image from "next/image";
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
  password: z.string().min(1, { message: "Password is required." }),
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
        description: "Welcome back! Redirecting...",
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

      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        await logoutUser();
        toast({
          variant: "destructive",
          title: "No Account Found",
          description: "No account exists with this Google account. Please sign up first.",
        });
      } else {
        await refreshUserProfile();
        toast({
          title: "Google Sign-In Successful!",
          description: "Welcome! Redirecting to the catalog...",
        });
        router.push("/catalog");
      }
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
          toast({
              variant: "destructive",
              title: "Google Sign-In Failed",
              description: "There was a problem signing you in with Google. Please try again.",
          });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <>
      <div className="grid text-center">
        <div className="flex justify-center">
            <Image src="/logo.png" alt="Sprout Logo" width={240} height={68} priority />
        </div>
        <div className="bg-primary/10 p-3 rounded-lg -mt-4 shadow-inner">
             <p className="text-sm font-medium text-center text-primary/90">
                Effortlessly Buy, Sell, &amp; Trade plants with communities that share your interests.
            </p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@example.com" {...field} />
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
                 <div className="flex items-center">
                  <FormLabel>Password</FormLabel>
                </div>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isGoogleLoading}>
             {form.formState.isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full"
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
      <div className="mt-2 text-center text-sm">
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
        <p>
          <Link href="/forgot-password" className="underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </>
  );
}
