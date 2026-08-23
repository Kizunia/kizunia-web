"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useCompetitionSuggestionStore } from "../../store/competition-suggestion-store";

export function AddCompetitionSuggestion() {
  const router = useRouter();

  const create = useCompetitionSuggestionStore(
    (state) => state.create,
  );

  const submit = useCompetitionSuggestionStore(
    (state) => state.submit,
  );

  const loading = useCompetitionSuggestionStore(
    (state) => state.loading,
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const suggestion = await create({
      suggestionTitle: title,
      ...(content.trim()
        ? {
            suggestionContent: content,
          }
        : {}),
    });

    await submit(suggestion.id);

    // router.push(
    //   `/competitions/suggestions/${suggestion.id}`,
    // );
    router.push(
      `/competitions/suggestions`,
    );
    router.refresh();
  }

  return (
    <div className=" w-full max-w-3xl">
      {/* <CardHeader>
        <CardTitle>Suggest a Competition</CardTitle>

        <CardDescription>
          Know a competition that should be on Kizunia?
          Tell us about it.
        </CardDescription>
      </CardHeader> */}

      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="suggestion-title">
              Competition title
            </Label>

            <Input
              id="suggestion-title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Google Solution Challenge"
              minLength={3}
              maxLength={150}
              required
              disabled={loading}
            />

            <p className="text-sm text-muted-foreground">
              Required
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestion-content">
              Description
            </Label>

            <Textarea
              id="suggestion-content"
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="Tell us anything useful about the competition..."
              rows={10}
              disabled={loading}
              className="resize-y"
            />

            <p className="text-sm text-muted-foreground">
              Optional. You can include dates, organizer
              details, links, prizes, or anything else you
              know. Markdown/MDX content is supported.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                loading || title.trim().length < 3
              }
            >
              {loading
                ? "Submitting..."
                : "Submit Suggestion"}
            </Button>
          </div>
        </form>
      </CardContent>
    </div>
  );
}