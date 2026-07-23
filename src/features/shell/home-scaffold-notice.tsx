export function HomeScaffoldNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Prospecta</h1>
      <p className="text-sm text-neutral-600">
        Fundação técnica pronta (Next.js + Prisma). Fluxo vertical e telas finais
        vêm nas próximas PRs.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
        <li>Auth ADMIN / MEMBER</li>
        <li>Leads + pipeline + atividades</li>
        <li>Handoff WhatsApp / e-mail</li>
      </ul>
    </main>
  );
}
