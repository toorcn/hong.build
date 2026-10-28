'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
export function RandomGuestbook(){const router=useRouter();useEffect(()=>{const pick=crypto.getRandomValues(new Uint8Array(1))[0]!;router.replace(`/guestbook/${pick<128?'orbit':'press'}-live?write=1`)},[router]);return <div className="content-scrim min-h-screen px-6 pt-36"><h1 className="text-3xl text-type">Making a little space for you…</h1><p className="mt-5 text-type-dim">A hello, a thought, a favourite emoji. Leave anything you’d like.</p><nav className="mt-8 flex gap-6 text-accent"><Link href="/guestbook/orbit-live?write=1">Open orbit ↗</Link><Link href="/guestbook/press-live?write=1">Open press ↗</Link></nav></div>}
