import '@/app/globals.css'
import React from "react";

export default async function Layout({ children } : {children: React.ReactNode}) {
    return (
        <html lang="en">
        <body>
        <main>{children}</main>
        </body>
        </html>
    )
}