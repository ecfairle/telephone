import { fetchAvailableDrawings } from '@/lib/data';
import Link from 'next/link';

export default async function Home() {
  const userId = '410544b2-4001-4271-9855-fec4b6a6442a';
  const drawings = await fetchAvailableDrawings(userId);
  const pastDrawings = drawings.filter(drawing => drawing.drawer_id !== null);
  const curDrawings = drawings.filter(drawing => drawing.drawer_id === null || drawing.drawer_id === userId);
  // const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  // console.log(pastDrawings[0].base64_image);
  return (<div className={"container"}>
    <p> {curDrawings.length > 0 ?
        <Link
            href={{
              pathname: `/canvas/${curDrawings[0].id}`}}
        > {"Start drawing your word " + curDrawings[0].target_word}</Link> : "NO WORDS"}</p>
    {/*{pastDrawings.length > 0 ?*/}
    {/*    <img src={`data:image/png;base64,${pastDrawings[0].base64_image}`}/> : "no old games"}*/}
      </div>)
    }
