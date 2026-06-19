"use client";

import { LoginForm } from "@/components/login-form";
import { loginAction } from "./actions";

export default function AdminLoginPage() {
  return <LoginForm action={loginAction} subtitle="Área da profissional" />;
}
