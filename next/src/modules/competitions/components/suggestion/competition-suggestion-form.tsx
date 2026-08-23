"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import {
  CreateCompetitionSuggestionInput,
  CreateCompetitionSuggestionSchema,
} from "@/modules/competitions/schemas/create-competition-suggestion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";

import { useCompetitionSuggestionStore } from "../../store/competition-suggestion-store";

/** 
 * @deprecated Use `AddCompetitionSuggestion` instead. This component is kept for backward compatibility and will be removed in future versions.
*/
export function CompetitionSuggestionForm() {
  const create = useCompetitionSuggestionStore((state) => state.create);

  const loading = useCompetitionSuggestionStore((state) => state.loading);

  const form = useForm<CreateCompetitionSuggestionInput>({
    resolver: zodResolver(CreateCompetitionSuggestionSchema),
    defaultValues: {
      suggestionTitle: "",
      suggestionContent: "",
    },
  });

  async function onSubmit(data: CreateCompetitionSuggestionInput) {
    const suggestion = await create(data);
    // await submit(suggestion.id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggest a Competition</CardTitle>

        <CardDescription>
          Know a competition that should be on Kizunia? Tell us about it.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="competition-suggestion-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="suggestionTitle"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="suggestionTitle">Title</FieldLabel>

                  <Input
                    {...field}
                    id="suggestionTitle"
                    placeholder="Google Solution Challenge 2027"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="suggestionContent"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="suggestionContent">
                    Description
                  </FieldLabel>

                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      value={field.value ?? ""}
                      id="suggestionContent"
                      rows={8}
                      className="min-h-40 resize-none"
                      placeholder="Tell us anything useful about this competition..."
                      aria-invalid={fieldState.invalid}
                    />

                    <InputGroupAddon align="block-end">
                      <InputGroupText className="tabular-nums">
                        {(field.value ?? "").length}
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>

                  <FieldDescription>
                    Optional. You can add links, dates, prizes, or anything else
                    you know.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                form="competition-suggestion-form"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Suggestion"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
