import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {useEffect, useState} from "react";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


/**
 * Hook that alerts clicks outside of the passed ref
 */
export function useOutsideAlerter(ref,setOpen) {

    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
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