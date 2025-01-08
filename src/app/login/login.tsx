'use client'
import {signIn, useSession} from "next-auth/react";
import {useEffect} from "react";

export default function LoginPage() {

    const { data: session } = useSession();
    useEffect(() => {
        if (session) {
            window.location.pathname = "/";
        }
    }, [session]);

    return (
        <div>
            <p>Login to access your account</p>

            <button onClick={() => signIn('discord', { callbackUrl: '/' })}>
                Login with OAuth
            </button>
        </div>
    );
}