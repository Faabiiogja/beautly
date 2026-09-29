// Coluna única centralizada de 480px, igual no mobile e no desktop (design system, layout público).
export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-1 flex-col bg-canvas">{children}</div>
}
