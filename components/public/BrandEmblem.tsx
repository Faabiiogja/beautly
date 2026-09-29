// Emblema floral "B" do Beautly (do design do Stitch), usado quando o tenant não tem logo.
export function BrandEmblem({ className = 'h-full w-full' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 100 100" aria-hidden>
      <path d="M42 48C34 44 26 48 24 56C22 64 30 70 38 68C46 66 48 54 42 48Z" fill="#feb8ab" />
      <path d="M52 38C45 32 37 36 36 45C35 54 44 59 51 56C58 53 59 42 52 38Z" fill="#ffb59e" />
      <path
        d="M45 74C56 74 65 67 65 58C65 52 61 47 55 45C60 43 63 38 63 33C63 25 56 20 46 20C40 20 35 22 32 25"
        stroke="#d97757"
        strokeLinecap="round"
        strokeWidth="7"
      />
    </svg>
  )
}
