"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  CreateHackathonInput,
  CreateHackathonSchema,
} from "@/modules/hackathons/schemas/create-hackathon";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { useCreateHackathonStore } from "../store/create-hackathon-store";

export default function CreateCompititionForm() {
  const createHackathon = useCreateHackathonStore((state) => state.create);

  const loading = useCreateHackathonStore((state) => state.loading);

  const form = useForm<CreateHackathonInput>({
    resolver: zodResolver(CreateHackathonSchema),
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      organizer: "",
      website: "",
      registrationLink: "",
    },
  });

  async function onSubmit(data: CreateHackathonInput) {
    await createHackathon(data);

  }
  return (
    <>
      <CardContent>
        <form id="create-hackathon-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Title */}

            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="title">Title</FieldLabel>

                  <Input
                    {...field}
                    id="title"
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

            {/* Slug */}

            <Controller
              name="slug"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="slug">Slug</FieldLabel>

                  <Input
                    {...field}
                    id="slug"
                    placeholder="google-solution-challenge-2027"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Short Description */}

            <Controller
              name="shortDescription"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="shortDescription">
                    Short Description
                  </FieldLabel>

                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      value={field.value ?? ""}
                      id="shortDescription"
                      rows={5}
                      className="min-h-24 resize-none"
                      placeholder="A short description of the hackathon..."
                      aria-invalid={fieldState.invalid}
                    />

                    <InputGroupAddon align="block-end">
                      <InputGroupText className="tabular-nums">
                        {(field.value ?? "").length}/500
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>

                  <FieldDescription>
                    This will be shown in hackathon cards and search results.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      <Field orientation="horizontal">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>

        <Button type="submit" form="create-hackathon-form" disabled={loading}>
          {loading ? "Creating..." : "Create Hackathon"}
        </Button>
      </Field>
    </>
  );
}
