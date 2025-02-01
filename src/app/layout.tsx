import '@/app/globals.css'
import React from "react";

export default async function Layout({ children } : {children: React.ReactNode}) {
    return (
        <html lang="en">
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body>
        <main>{children}</main>
        </body>
        </html>
    )
}