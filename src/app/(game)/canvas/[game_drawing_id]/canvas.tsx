'use client'

import { useRef, useState} from 'react'
import { OpenableComponent } from '@/components/modal'
import {
    ReactSketchCanvas,
    type ReactSketchCanvasRef
} from 'react-sketch-canvas'

import { Button } from '@/components/button'
import { Eraser, Pen, Redo, RotateCcw, Undo, Circle } from 'lucide-react'
import Github from '@uiw/react-color-github';
import { uploadImage } from '@/lib/api'
import { useRouter } from 'next/navigation'
import {useSession} from "next-auth/react";
import Dropdown from "@restart/ui/Dropdown";


export default function Canvas({secretWord, gameDrawingId} : {secretWord:string, gameDrawingId:string}) {
    const router = useRouter();
    const session = useSession();
    if (!session) {
        router.push('/login');
    }
    console.log('user id' + session?.data?.user?.userId)
    const canvasRef = useRef<ReactSketchCanvasRef>(null)
    const [strokeColor, setStrokeColor] = useState('#4fab50')
    const [strokeWidth, setStrokeWidth] = useState(4)
    const [eraseMode, setEraseMode] = useState(false)
    const [word] = useState(secretWord);
    const [displaySizeSelector, setDisplaySizeSelector] = useState(false);
    const [displayColorSelector, setDisplayColorSelector] = useState(false);
    const colors = [
        '#B80000',
        '#DB3E00',
        '#FCCB00',
        '#008B02',
        '#006B76',
        '#1273DE',
        '#004DCF',
        '#5300EB',
        '#EB9694',
        '#FAD0C3',
        '#FEF3BD',
        '#C1E1C5',
        '#BEDADC',
        '#C4DEF6',
        '#BED3F3',
        '#D4C4FB',
        '#FFFFFF',
        '#000000'
    ];

    function handleEraserClick() {
        setEraseMode(true)
        canvasRef.current?.eraseMode(true)
    }

    function handlePenClick() {
        setEraseMode(false)
        canvasRef.current?.eraseMode(false)
    }

    function handleUndoClick() {
        canvasRef.current?.undo()
    }

    function handleRedoClick() {
        canvasRef.current?.redo()
    }

    function handleClearClick() {
        canvasRef.current?.clearCanvas()
    }

    async function handleSave() {
        const dataURL = await canvasRef.current?.exportImage('png');
        if (!dataURL) {
            console.log('failed to export canvas');
            return;
        }
        await uploadImage(dataURL, `${gameDrawingId}.png`, gameDrawingId);

        router.push(`/`);
    }

    return (
        <section className='py-24'>
            <div className='container mx-auto max-w-fit justify-center text-center'>
                <div className='text-3xl justify-center text-center'>{"draw: " + word}</div>
                <div className='mt-6 flex max-w-2xl gap-4'>
                    <ReactSketchCanvas
                        width='2000px'
                        height='500px'
                        ref={canvasRef}
                        strokeColor={strokeColor}
                        strokeWidth={strokeWidth}
                        canvasColor='transparent'
                        className='!rounded-2xl !border-purple-500 dark:!border-purple-800'
                    />

                    <div
                        className='flex flex-col items-center gap-3 pt-6  position-relative'>
                        {/* Color picker */}
                            <Button
                                size='icon'
                                type='button'
                                onClick={() => setDisplayColorSelector(true)}
                                style={{backgroundColor: strokeColor}}
                            >
                                {displayColorSelector && <OpenableComponent setOpen={setDisplayColorSelector}>
                                    <Github
                                        color={strokeColor}
                                        colors={colors}
                                        style={{
                                            'width': '65px',
                                        }}
                                        onChange={(color) => {
                                            setStrokeColor(color.hex);
                                            setDisplayColorSelector(false);
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                        }}
                                    />
                                </OpenableComponent>}

                            </Button>
                            {/* Size scroller */}
                            <Dropdown show={displaySizeSelector}
                                      onToggle={(nextShow) => setDisplaySizeSelector(nextShow)}>
                                <Dropdown.Toggle>
                                    {(props) => (
                                        <Button size='icon'
                                                type='button'
                                                {...props}>
                                            <Circle size={strokeWidth + 3} fill="#111" strokeWidth={0}/>
                                        </Button>
                                    )}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {(menuProps, meta) => (
                                        <ul
                                            {...menuProps}
                                            className="border p-2 shadow-md absolute z-10 bg-white items-center"
                                            style={{
                                                visibility: meta.show ? "visible" : "hidden",
                                                opacity: meta.show ? "1" : "0",
                                            }}
                                        >
                                            <li><Button
                                                size='icon'
                                                type='button'
                                                variant='outline'
                                                onClick={(e) => {
                                                    setStrokeWidth(4);
                                                    setDisplaySizeSelector(false);
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <Circle size={7} fill="#111" strokeWidth={0}/>
                                            </Button></li>
                                            <li><Button
                                                size='icon'
                                                type='button'
                                                variant='outline'
                                                onClick={() => {
                                                    setStrokeWidth(8);
                                                    setDisplaySizeSelector(false);
                                                }}
                                            >
                                                <Circle size={11} fill="#111" strokeWidth={0}/>
                                            </Button></li>
                                            <li><Button
                                                size='icon'
                                                type='button'
                                                variant='outline'
                                                onClick={() => {
                                                    setStrokeWidth(12);
                                                    setDisplaySizeSelector(false);
                                                }}
                                            >
                                                <Circle size={15} fill="#111" strokeWidth={0}/>
                                            </Button></li>

                                        </ul>
                                    )}
                                </Dropdown.Menu>
                            </Dropdown>
                            {/* Drawing mode */}

                            <Button
                                size='icon'
                                type='button'
                                variant='outline'
                                disabled={!eraseMode}
                                onClick={handlePenClick}
                            >
                                <Pen size={16}/>
                            </Button>
                            <Button
                                size='icon'
                                type='button'
                                variant='outline'
                                disabled={eraseMode}
                                onClick={handleEraserClick}
                            >
                                <Eraser size={16}/>
                            </Button>

                        {/* Actions */}
                            <Button
                                size='icon'
                                type='button'
                                variant='outline'
                                onClick={handleUndoClick}
                            >
                                <Undo size={16}/>
                            </Button>
                            <Button
                                size='icon'
                                type='button'
                                variant='outline'
                                onClick={handleRedoClick}
                            >
                                <Redo size={16}/>
                            </Button>
                            <Button
                                size='icon'
                                type='button'
                                variant='outline'
                                onClick={handleClearClick}
                            >
                                <RotateCcw size={16}/>
                            </Button>
                    </div>
                </div>
                <Button
                    className='m-4'
                    size='lg'
                    type='button'
                    variant='outline'
                    onClick={handleSave}
                >
                    Submit
                </Button>
            </div>
        </section>
)
}
