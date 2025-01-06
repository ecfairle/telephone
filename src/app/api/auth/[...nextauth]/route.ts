import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import PostgresAdapter from "@auth/pg-adapter"
import { createPool } from "@vercel/postgres"

const pool = createPool();
const handler = NextAuth({
    adapter: PostgresAdapter(pool),
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_ID as string,
            clientSecret: process.env.DISCORD_SECRET as string
        })
    ],
})

export {handler as GET, handler as POST}