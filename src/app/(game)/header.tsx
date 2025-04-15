"use client"
import {Button} from "@/components/button";
import {signIn, signOut, useSession} from "next-auth/react";
import {useRouter} from "next/navigation";

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();

    return (
        <div className={"text-left bg-background accent-red-50 p-2 mb-3"}>{
            session?
                <div className={'space-x-3 flex'}>
                    <span className={'mr-5'}>{session.user.name}</span>
                    <Button onClick={() => signOut()}>Sign Out</Button>
                    <Button onClick={() => router.push('/')}>Play with friends</Button>
                    <Button variant={'blue'}
                                   onClick={() => router.push('/shuffle')}>
                        Play with strangers
                    </Button>
                </div>
                :
                <Button onClick={() => signIn('discord', { callbackUrl: '/' })}>Sign In</Button>

        }
        </div>
    )
}