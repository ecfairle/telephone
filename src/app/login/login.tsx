'use client'
import {signIn, useSession} from "next-auth/react";
import {useEffect} from "react";
import {useSearchParams} from "next/navigation";

export default function LoginPage() {

    const { data: session } = useSession();
    useEffect(() => {
        if (session) {
            window.location.pathname = "/";
        }
    }, [session]);

    const searchParams = useSearchParams();
    const callbackUrl = searchParams.has('room_id')? `/join_room/${searchParams.get('room_id')}`: '/';
    console.log('CALLBACK', callbackUrl)
    return (
        <div>
            <p>Login to access your account</p>

            <button onClick={() => signIn('discord', {callbackUrl: callbackUrl})}>
                Login with Discord
            </button>
            <br/>
            <button onClick={() => signIn('google', {callbackUrl: callbackUrl})}>
                Login with Google
            </button>
        </div>
    );
}