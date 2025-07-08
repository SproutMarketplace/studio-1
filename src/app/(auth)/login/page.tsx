
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth, signInWithGooglePopup } from "@/lib/firebase"; 
import { signInWithEmailAndPassword } from "firebase/auth"; 
import { useAuth } from "@/contexts/auth-context";
import { registerUser } from "@/lib/firestoreService";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.63 1.9-3.87 0-7-3.13-7-7s3.13-7 7-7c1.73 0 3.26.56 4.48 1.73l2.43-2.43C17.47 1.88 15.22 1 12.48 1 5.88 1 1 5.88 1 12.48s4.88 11.48 11.48 11.48c3.22 0 5.85-1.13 7.84-3.13 2.1-2.1 2.53-5.22 2.53-8.32 0-.6-.05-1.18-.15-1.73H12.48z" />
      </svg>
    );
  }

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshUserProfile } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const handleGoogleSignIn = async () => {
    try {
        const result = await signInWithGooglePopup();
        const { user } = result;

        const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
        if (isNewUser) {
           await registerUser(user.email!, "password", user.displayName || 'Sprout User');
        }
        
        await refreshUserProfile();
        
        toast({
            title: "Sign In Successful!",
            description: "Welcome to Sprout!",
        });
        router.push("/catalog");
    } catch (error: any) {
        if (error.code !== "auth/popup-closed-by-user") {
            toast({
                variant: "destructive",
                title: "Google Sign-In Failed",
                description: "There was a problem signing you in with Google. Please try again.",
            });
        }
    }
  };

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

  return (
    <>
      <div className="grid gap-1 text-center">
        <div className="flex justify-center">
            <Image src="/logo.png" alt="Sprout Logo" width={240} height={68} priority />
        </div>
        <p className="text-balance text-muted-foreground">
            Effortlessly Buy, Sell, & Trade plants with communities that share your interests.
        </p>
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
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
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
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
        <GoogleIcon className="mr-2 h-4 w-4" />
        Sign in with Google
      </Button>
      <div className="mt-4 text-center text-sm">
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
