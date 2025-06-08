
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Mail, KeyRound, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase"; // Import Firebase auth
import { sendPasswordResetEmail } from "firebase/auth"; // Import Firebase auth function

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
            // We typically don't want to confirm if an email exists for security reasons
            // So we show a generic message.
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
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center px-6 pt-3 pb-4">
        <CardTitle className="text-3xl font-bold text-primary">Forgot Password?</CardTitle>
        <CardDescription>Enter your email to receive a reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Email</FormLabel>
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
            <Button type="submit" className="w-full text-lg py-6" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending Link..." : (
                <>
                  <KeyRound className="mr-2 h-5 w-5" /> Send Reset Link
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center">
        <Button variant="link" asChild className="text-muted-foreground hover:text-primary">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
