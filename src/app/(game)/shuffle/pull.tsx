"use client";

import {Button} from "@/components/button";
import {pullShuffle} from "@/lib/api";

export default function Pull() {
    return (
        <Button onClick={async () => await pullShuffle()}>Pull</Button>
    )
}