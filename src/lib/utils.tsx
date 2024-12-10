import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {MutableRefObject, useEffect, useRef} from "react";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


/**
 * Hook that alerts clicks outside the passed ref
 */
function useOutsideAlerter(ref: MutableRefObject<null|HTMLDivElement>, setOpen: (open: boolean) => void) {

    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref]);
}

/**
 * Component that alerts if you click outside of it
 */
export function OpenableComponent({children, setOpen} : {children: React.ReactNode, setOpen: (open: boolean) => void}) {
    const wrapperRef:MutableRefObject<null> = useRef(null);
    useOutsideAlerter(wrapperRef, setOpen);
    return <div ref={wrapperRef}><div>{children}</div></div>;
}

export async function saveImageToGCS(dataURL:string, filename:string) {
    const res = await fetch(`/upload_url`,{
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename
        })
    })
    const url = await res.json();
    const newUrl = new URL(url.url);
    const formData = new FormData();

    Object.entries(url.fields).forEach(([key, value]) => formData.append(key, value as string));
    formData.append('file', dataURLtoFile(dataURL, filename) as Blob);

    return await fetch(newUrl, {
        method: 'POST',
        body: formData
    })
}

function dataURLtoFile(dataurl:string, filename:string) {
    const arr = dataurl.split(','),
        mimeOrNull = arr[0].match(/:(.*?);/),
        mime = mimeOrNull ? mimeOrNull[1] : 'image/png',
        bstr = atob(arr[arr.length - 1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    let i = n;
    while(i--){
        u8arr[i] = bstr.charCodeAt(i);
    }
    return new File([u8arr], filename, {type:mime});
}