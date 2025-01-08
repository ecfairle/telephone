"use client"
import {Button} from "@/components/button";
import {signIn, signOut, useSession} from "next-auth/react";

export default function Header() {
    const { data: session } = useSession();

    return (
        <div className={"text-center bg-background accent-red-50 p-5"}>{
            session? <Button onClick={() => signOut()}>Sign Out</Button> : <Button onClick={() => signIn('discord', { callbackUrl: '/' })}>Sign In</Button>
        }
        </div>
    )
}