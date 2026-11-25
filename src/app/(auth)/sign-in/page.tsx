"use client";

import { useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { signIn } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
type SignInFormProps = React.ComponentProps<"div">;

export default function SignInForm({
  className,
  ...props
}: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
const router = useRouter()
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const userData = Object.fromEntries(formData.entries());

    try {
      setIsLoading(true);

      const { data, error } = await signIn.email({
        email: userData.email as string,
        password: userData.password as string,
      });

      if (error) {
        console.log(error.message);
        return;
      }

    if(data){
        console.log("Login successful:", data);

        const nextParam = new URLSearchParams(window.location.search).get(
          "next"
        );
        const safeNext =
          nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
            ? nextParam
            : "/";

        router.push(safeNext);
        router.refresh();
    }
    } catch (error) {
      console.log("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "mx-auto mt-10 flex max-w-md flex-col gap-6",
        className
      )}
      {...props}
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Welcome Back
          </CardTitle>

          <CardDescription>
            Sign in to your MentorLagbe account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {/* Social Login */}
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>

                  Continue with Google
                </Button>
              </Field>

              <FieldSeparator>
                Or continue with email
              </FieldSeparator>

              {/* Email */}
              <Field>
                <FieldLabel htmlFor="email">
                  Email
                </FieldLabel>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                />
              </Field>

              {/* Password */}
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">
                    Password
                  </FieldLabel>

                  <Link
                    href="/forgot-password"
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </Field>

              {/* Submit */}
              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="font-medium underline underline-offset-4"
                  >
                    Sign Up
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Terms */}
      <FieldDescription className="px-6 text-center">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  );
}