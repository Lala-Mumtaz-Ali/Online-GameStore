import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(_request: NextRequest) {
  // Add middleware logic here
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
