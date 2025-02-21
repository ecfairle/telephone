"use client"
import {Button} from "@/components/button";
import {signIn, signOut, useSession} from "next-auth/react";

export default function Header() {
    const { data: session } = useSession();

    return (
        <div className={"text-left bg-background accent-red-50 p-2 mb-3"}>{
            session?
                <div> <span className={'mr-5'}>{session.user.name}</span> <Button onClick={() => signOut()}>Sign Out</Button></div> :
                <Button onClick={() => signIn('discord', { callbackUrl: '/' })}>Sign In</Button>
        }
        </div>
    )
}