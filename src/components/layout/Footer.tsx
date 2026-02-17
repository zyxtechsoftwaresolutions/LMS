export function Footer() {
  return (
    <footer className="border-t-2 border-border/50 bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} Vhub. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Developed by:{" "}
            <a 
              href="https://onetaporbit.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              onetaporbit
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
