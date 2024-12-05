import Canvas from '@/app/canvas/[game_drawing_id]/canvas';
import { fetchGames } from '@/lib/data';
import Link from 'next/link';

export default async function Home() {
  const drawings = await fetchGames('410544b2-4001-4271-9855-fec4b6a6442a');
  const pastDrawings = drawings.filter(drawing => drawing.image !== null);
  const curDrawings = drawings.filter(drawing => drawing.image === null);
  // const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  // console.log(pastDrawings[0].base64_image);
  return (<div className={"container"}>
    <p> {curDrawings.length > 0 ?
        <Link
            href={{
              pathname: `/canvas/${curDrawings[0].id}`}}
        > {"Start drawing your word " + curDrawings[0].target_word}</Link> : "NO WORDS"}</p>
    {pastDrawings.length > 0 ?
        <img src={`data:image/png;base64,${pastDrawings[0].base64_image}`}/> : "no old games"}
      </div>)
    }
