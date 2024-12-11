// CREATE TABLE IF NOT EXISTS game_drawings (
//     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//     game_id UUID NOT NULL REFERENCES games,
//     next_id UUID REFERENCES game_drawings(id),
//     drawer_id UUID REFERENCES users,
//     guesser_id UUID REFERENCES users,
//     target_word TEXT,
//     image BYTEA
// );
export type GameDrawing = {
    id: string,
    game_id: string,
    next_id: string,
    drawer_id: string,
    guesser_id: string,
    target_word: string,
    guesser_name: string,
    drawer_name: string,
    drawing_done: boolean
}

// CREATE TABLE IF NOT EXISTS games (
//     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//     original_word TEXT NOT NULL
// );
export type Game = {
    id: string,
    original_word: string
}

// CREATE TABLE IF NOT EXISTS users (
//     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//     name VARCHAR(255) NOT NULL,
//     email TEXT NOT NULL UNIQUE,
//     password TEXT NOT NULL
// );
export type User = {
    id: string,
}