// Mesma página para subdomínio inexistente e tenant inativo: não revela qual dos dois é.
export function Unavailable() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-xl font-semibold">Página indisponível</h1>
      <p className="text-zinc-600">Esta página não está disponível no momento.</p>
    </main>
  )
}
