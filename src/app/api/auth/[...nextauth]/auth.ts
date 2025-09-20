import {createPool} from "@vercel/postgres";
import {NextAuthOptions} from "next-auth";
import PostgresAdapter from "@auth/pg-adapter";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import fs from 'fs/promises';
import path from 'path';

const pool = createPool();

// Helper function to get a random animal avatar
async function getRandomAvatar() {
    // Get list of animal avatars
    const avatarDir = path.join(process.cwd(), 'public', 'animal_avatars');
    const avatarFiles = await fs.readdir(avatarDir);
    const randomAvatar = avatarFiles[Math.floor(Math.random() * avatarFiles.length)];
    return `/animal_avatars/${randomAvatar}`;
}

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXT_AUTH_SECRET as string,
    adapter: PostgresAdapter(pool),
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_ID as string,
            clientSecret: process.env.DISCORD_SECRET as string,
            profile: async (profile) => {
                const avatarPath = await getRandomAvatar();
                return {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    image: avatarPath
                }
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID as string,
            clientSecret: process.env.GOOGLE_SECRET as string,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            },
            profile: async (profile) => {
                const avatarPath = await getRandomAvatar();
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: avatarPath
                }
            }
        }),
        CredentialsProvider({
            id: 'anonymous',
            name: 'Anonymous',
            credentials: {},
            authorize: async () => {
                const pg = PostgresAdapter(pool);
                if (!pg?.createUser) {
                    throw new Error('Postgres Adapter not configured correctly');
                }
                
                // Read adjectives and nouns from files
                const adjectiveFilePath = path.join(process.cwd(), 'src', 'data', 'name_adj.txt');
                const nounFilePath = path.join(process.cwd(), 'src', 'data', 'name_noun.txt');
                
                const adjectiveList = (await fs.readFile(adjectiveFilePath, 'utf-8')).split('\n').map(line => line.trim()).filter(line => line != '');
                const nounList = (await fs.readFile(nounFilePath, 'utf-8')).split('\n').map(line => line.trim()).filter(line => line !== '');
                
                const noun = nounList[Math.floor(Math.random() * nounList.length)];
                const adjective = adjectiveList[Math.floor(Math.random() * adjectiveList.length)];
                const username = `${adjective[0].toUpperCase() + adjective.slice(1)}${noun[0].toUpperCase() + noun.slice(1)}`;
                
                // Get random avatar (keeping this logic for anonymous login)
                const avatarPath = await getRandomAvatar();
                
                const user = pg.createUser({ 
                    id: 'anonymous',
                    name: username,
                    email: 'guest@example.com',
                    emailVerified: null,
                    image: avatarPath
                })

                return user
            }
        })
    ],
    callbacks: {
        session: async ({ session, token }) => {
            if (session?.user) {
                session.user.userId = token.userId;
            }
            return session;
        },
        jwt: async ({ user, token }) => {
            if (user) {
                token.userId = user.id;
            }
            return token;
        },
    },
    session: {
        strategy: 'jwt',
    },
}
