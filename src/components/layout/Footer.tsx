export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0 px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by GameStore Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
