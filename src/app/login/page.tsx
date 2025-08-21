"use client";
import GoogleBtn from "@/components/auth/google-signin";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <Card className="w-full max-w-[350px] sm:max-w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            				{isLogin ? "Welcome to Scalez" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin 
              ? "Sign in to your account to continue creating amazing videos"
              : "Create your account to start creating amazing videos"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isLogin ? <LoginForm /> : <RegisterForm />}
          
          {isLogin && (
            <>
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
              <GoogleBtn />
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-muted-foreground text-center mb-4">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground text-center">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-primary">
              Privacy Policy
            </a>
            .
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
