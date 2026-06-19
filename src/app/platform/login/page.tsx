"use client";

import { LoginForm } from "@/components/login-form";
import { loginAction } from "./actions";

export default function PlatformLoginPage() {
  return (
    <LoginForm action={loginAction} subtitle="Administração da plataforma" />
  );
}
