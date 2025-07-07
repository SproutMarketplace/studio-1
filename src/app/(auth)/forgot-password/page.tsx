
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase"; 
import { sendPasswordResetEmail } from "firebase/auth"; 

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    form.clearErrors();

    if (!auth) {
        toast({
            variant: "destructive",
            title: "Offline Mode",
            description: "This feature is disabled in offline mode. Please configure Firebase keys.",
        });
        return;
    }

    try {
      await sendPasswordResetEmail(auth, data.email);
      toast({
        title: "Password Reset Link Sent",
        description: `If an account exists for ${data.email}, a password reset link has been sent. Please check your inbox (and spam folder).`,
      });
      form.reset();
    } catch (error: any) {
      console.error("Forgot password error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/invalid-email":
            errorMessage = "The email address is not valid.";
            break;
          case "auth/user-not-found":
            errorMessage = "If an account exists for this email, a reset link has been sent.";
            toast({
              title: "Password Reset Link Sent",
              description: errorMessage,
            });
            form.reset();
            return;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      toast({
        variant: "destructive",
        title: "Failed to Send Reset Link",
        description: errorMessage,
      });
    }
  }

  return (
     <>
        <div className="grid gap-2 text-left">
          <h1 className="text-3xl font-bold">Forgot your password?</h1>
          <p className="text-balance text-muted-foreground">
            No problem. Enter your email and we'll send you a reset link.
          </p>
        </div>
      
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending Link..." : "Send Reset Link"}
            </Button>
          </form>
        </Form>
      
        <div className="mt-4 text-center text-sm">
          Remembered your password?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
    </>
  );
}
