import bcrypt from 'bcrypt';
import { db } from '@vercel/postgres';
const users = [
    {
        id: '410544b2-4001-4271-9855-fec4b6a6442a',
        name: 'User',
        email: 'user@nextmail.com',
        password: '123456',
    },
    {
        id: '41051234-4001-4271-9855-fec4b6a6442b',
        name: 'User2',
        email: 'user2@nextmail.com',
        password: '123456',
    },
];

const games = [
    {
        id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
        original_word: 'cloud',
    },
];

const game_users = [
    {
        id: '816aa791-174b-4ae4-b455-45c558f2ae95',
        user_id: '410544b2-4001-4271-9855-fec4b6a6442a',
        game_id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
    },
    {
        id: '85511cb3-0a24-4e0f-9935-84d56d7ce5c0',
        user_id: '41051234-4001-4271-9855-fec4b6a6442b',
        game_id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
    },
];

const game_drawings = [
    {
        id: '2257f0df-4cd4-4ce7-a5ef-39a1b990b8fe',
        game_id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
        drawer_id: null,
        guesser_id: null,
        target_word: 'cloud',
        next_id: null,
        drawing_done: false,
        is_first: true,
        prev_game_drawing_id: null,
    },
    {
        id: '7dc14ffd-dace-424f-ad04-4cda3574b9c2',
        game_id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
        drawer_id: null,
        guesser_id: null,
        target_word: null,
        next_id: null,
        drawing_done: false,
        is_first: false,
        prev_game_drawing_id: '2257f0df-4cd4-4ce7-a5ef-39a1b990b8fe'
    }
];
const client = await db.connect();

async function seedUsers() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await client.sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return client.sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}

async function seedGames() {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await client.sql`
    CREATE TABLE IF NOT EXISTS games (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      original_word TEXT NOT NULL
    );
  `;

    const insertedGames = await Promise.all(
        games.map(async (game) => {
            return client.sql`
        INSERT INTO games (id, original_word)
        VALUES (${game.id}, ${game.original_word})
        ON CONFLICT (id) DO NOTHING;
      `;
        }),
    );

    await client.sql`
    CREATE TABLE IF NOT EXISTS game_users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      game_id UUID NOT NULL REFERENCES games,
      user_id UUID NOT NULL REFERENCES users
    );
  `;

    await Promise.all(
        game_users.map(async (game_user) => {
            return client.sql`
        INSERT INTO game_users (id, game_id, user_id)
        VALUES (${game_user.id}, ${game_user.game_id}, ${game_user.user_id})
        ON CONFLICT (id) DO NOTHING;
      `;
        }),
    );

    await client.sql`
    CREATE TABLE IF NOT EXISTS game_drawings (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      game_id UUID NOT NULL REFERENCES games,
      drawing_done boolean NOT NULL,
      drawer_id UUID REFERENCES users,
      guesser_id UUID REFERENCES users,
      target_word TEXT,
      image BYTEA,
      prev_game_drawing_id UUID REFERENCES game_drawings
    );
  `;

    await Promise.all(
        game_drawings.map(async (game_drawing) => {
            return client.sql`
        INSERT INTO game_drawings (id, game_id, drawer_id, guesser_id, target_word, drawing_done, prev_game_drawing_id)
        VALUES (${game_drawing.id}, ${game_drawing.game_id}, ${game_drawing.drawer_id}, ${game_drawing.guesser_id}, ${game_drawing.target_word}, ${game_drawing.drawing_done}, ${game_drawing.prev_game_drawing_id})
        ON CONFLICT (id) DO NOTHING;
      `;
        }),
    );

    return insertedGames;
}

export async function GET() {
    try {
      await client.sql`BEGIN`;
      await client.sql`DROP TABLE game_users; DROP TABLE game_drawings; DROP TABLE games; `;
      await seedUsers();
      await seedGames();
      await client.sql`COMMIT`;

      return Response.json({ message: 'Database seeded successfully' });
    } catch (error) {
      await client.sql`ROLLBACK`;
      return Response.json({ error }, { status: 500 });
    }
}