export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 p-8">
      <h1 className="text-2xl font-semibold">403</h1>
      <p className="text-sm text-neutral-600">
        Você não tem permissão para acessar este recurso.
      </p>
    </main>
  );
}
