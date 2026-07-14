"use client"

import Link from "next/link"

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex">
      <div className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">Discover</h2>
        <div className="mt-4 flex flex-col space-y-2">
          <Link href="/new" className="text-sm text-muted-foreground hover:text-primary">New Releases</Link>
          <Link href="/top" className="text-sm text-muted-foreground hover:text-primary">Top Sellers</Link>
          <Link href="/upcoming" className="text-sm text-muted-foreground hover:text-primary">Upcoming</Link>
        </div>
      </div>
      <div className="p-6 pt-0">
        <h2 className="text-lg font-semibold tracking-tight">Genres</h2>
        <div className="mt-4 flex flex-col space-y-2">
          <Link href="/genre/action" className="text-sm text-muted-foreground hover:text-primary">Action</Link>
          <Link href="/genre/rpg" className="text-sm text-muted-foreground hover:text-primary">RPG</Link>
          <Link href="/genre/strategy" className="text-sm text-muted-foreground hover:text-primary">Strategy</Link>
        </div>
      </div>
    </aside>
  )
}
