import Canvas from '@/app/canvas/[game_drawing_id]/canvas';
import { fetchGames } from '@/lib/data';
import Link from 'next/link';

export default async function Home() {
  const drawings = await fetchGames('410544b2-4001-4271-9855-fec4b6a6442a');
  return (<div className={"container"}>
    <p> {drawings.length > 0 ?
        <Link
            href={{
              pathname: `/canvas/${drawings[0].id}`}}
        > {"Start drawing your word " + drawings[0].target_word}</Link> : "NO WORDS"}</p>
  </div>)
}
