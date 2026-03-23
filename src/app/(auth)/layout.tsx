export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-foreground tracking-tight">
            Twogether
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Wedding planning for two
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
