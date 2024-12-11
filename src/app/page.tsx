import { fetchAvailableDrawings } from '@/lib/data';
import Link from 'next/link';
import {getSignedUrl} from "@/lib/gcs";

export default async function Home() {
  const userId = '410544b2-4001-4271-9855-fec4b6a6442a';
  const drawings = await fetchAvailableDrawings(userId);
  const pastDrawings = drawings.filter(drawing => drawing.drawer_id !== null);
  const curDrawings = drawings.filter(drawing => (drawing.drawer_id === null || drawing.drawer_id === userId) && drawing.drawing_done === false);

  async function displayPastDrawings() {
    return await getSignedUrl(pastDrawings[0].id);
  }

  return (<div className={"container"}>
    <p> {curDrawings.length > 0 ?
        <Link
            href={{
              pathname: `/canvas/${curDrawings[0].id}`}}
        > {"Start drawing your word " + curDrawings[0].target_word}</Link> : "NO WORDS"}</p>
    {pastDrawings.length > 0 ?
        <div><p>{`You drew \"${pastDrawings[0].target_word}\"`}</p><img alt='past drawing' src={`${await displayPastDrawings()}`}/></div> : "no old games"}
      </div>)
    }
