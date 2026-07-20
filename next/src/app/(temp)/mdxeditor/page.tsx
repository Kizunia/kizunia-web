"use client"
import { ForwardRefEditor } from "@/components/shared/mdx/ForwardRefEditor";
import { Suspense } from "react";

export default function SignInPage() {
    const markdown = "# hello this is a heading \n \n this is a **bold** text and this is an *italic* text";
    return (<>
        <Suspense fallback={null}>
            <ForwardRefEditor markdown={markdown} />
        </Suspense>
    </>)
}