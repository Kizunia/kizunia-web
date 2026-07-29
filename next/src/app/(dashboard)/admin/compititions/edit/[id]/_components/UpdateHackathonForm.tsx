"use client";

import { useState } from "react";
import { useRef } from "react";
import {
  ForwardRefEditor,
} from "@/components/shared/mdx/ForwardRefEditor";
import {
  type MDXEditorMethods,
} from "@mdxeditor/editor";

export default function UpdateHackathonForm({
  hackathonId,
}: {
  hackathonId: string;
}) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState<string>();
  const [shortDescription, setShortDescription] = useState<string>();
  const [organizer, setOrganizer] = useState<string>();
  const [website, setWebsite] = useState<string>();
  const [registrationLink, setRegistrationLink] = useState<string>();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        `/api/v1/admin/hackathons/update/${hackathonId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            shortDescription,
            organizer,
            website,
            registrationLink,
            content:  editorRef.current?.getMarkdown() ?? "no content from editor",
          }),
        },
      );

      const result = await response.json();

      console.log(result);

      if (!response.ok) {
        alert(result.error?.message ?? "Request failed.");
        return;
      }

      alert("Hackathon updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4 p-8">
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded border p-2"
      />

      <textarea
        placeholder="Short Description"
        value={shortDescription}
        onChange={(e) => setShortDescription(e.target.value)}
        className="rounded border p-2"
      />

      <input
        placeholder="Organizer"
        value={organizer}
        onChange={(e) => setOrganizer(e.target.value)}
        className="rounded border p-2"
      />

      <input
        placeholder="Website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="rounded border p-2"
      />

      <input
        placeholder="Registration Link"
        value={registrationLink}
        onChange={(e) => setRegistrationLink(e.target.value)}
        className="rounded border p-2"
      />

      <div className="space-y-2">
        <label className="font-medium">Content</label>

        <ForwardRefEditor
          ref={editorRef}
          markdown=""
          className="min-h-[700px] rounded-md border z-0 "
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white"
      >
        {loading ? "Updating..." : "Update Hackathon"}
      </button>
    </form>
  );
}
