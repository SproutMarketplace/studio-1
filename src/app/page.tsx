
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import Image from "next/image";
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
import { Mail, ArrowRight, Sparkles } from "lucide-react";

const landingEmailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type LandingEmailFormValues = z.infer<typeof landingEmailSchema>;

export default function LandingPage() {
  const { toast } = useToast();

  const form = useForm<LandingEmailFormValues>({
    resolver: zodResolver(landingEmailSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(data: LandingEmailFormValues) {
    console.log("Email submitted:", data.email); // Placeholder for actual submission
    toast({
      title: "Subscribed!",
      description: "Thanks for your interest! We'll keep you updated on Sprout.",
    });
    form.reset();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
        <Image src="/logo.png" alt="Sprout Logo" width={140} height={39} priority />
        <div className="space-x-2">
          <Button variant="ghost" asChild className="hover:bg-primary/10 hover:text-primary">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="text-center space-y-8 max-w-2xl">
        <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="Sprout Logo" width={320} height={89} priority data-ai-hint="logo plant" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
          Welcome to <span className="text-primary">Sprout</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto">
          The best place to discover, trade, and sell plants. Join our growing community of plant enthusiasts!
        </p>

        <div className="w-full max-w-md mx-auto pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Email for updates</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="Enter your email for updates" 
                          {...field} 
                          className="pl-10 text-lg py-6 rounded-full shadow-lg focus:ring-2 focus:ring-primary" 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full text-lg py-6 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Submitting..." : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" /> Stay Updated
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
        
        <div className="pt-8">
            <p className="text-muted-foreground">Ready to dive in?</p>
            <Button variant="link" asChild className="text-lg text-primary hover:text-primary/80 px-0">
                <Link href="/signup">
                Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
            </Button>
        </div>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Sprout Plant Marketplace. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
