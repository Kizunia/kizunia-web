"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePortfolioStore } from "../../../store/portfolio.store";
import { DocumentUploader } from "@/modules/assets/frontend/components/document-uploader";

interface ProfileFormState {
  displayName: string;
  headline: string;
  bio: string;
  phone: string;
  publicContactEmail: string;
  location: string;
  resumeAssetId: string;
}

const EMPTY_FORM: ProfileFormState = {
  displayName: "",
  headline: "",
  bio: "",
  phone: "",
  publicContactEmail: "",
  location: "",
  resumeAssetId: "",
};

export function ProfileEditor() {
  const portfolio = usePortfolioStore((state) => state.portfolio);
  // load protfolio
  const getMine = usePortfolioStore((state) => state.getMine);
  const isLoading = usePortfolioStore((state) => state.isLoading);
  const error = usePortfolioStore((state) => state.error);
  const updateProfile = usePortfolioStore((state) => state.updateProfile);

  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!portfolio) {
      return;
    }

    setForm({
      displayName: portfolio.displayName ?? "",
      headline: portfolio.headline ?? "",
      bio: portfolio.bio ?? "",
      phone: portfolio.phone ?? "",
      publicContactEmail: portfolio.publicContactEmail ?? "",
      location: portfolio.location ?? "",
      resumeAssetId: portfolio.resumeAssetId ?? "",
    });
  }, [portfolio]);

  useEffect(() => {
    if (!portfolio) {
      getMine();
    }
  }, []);

  const updateField = <K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await updateProfile({
        displayName: form.displayName,
        headline: form.headline || null,
        bio: form.bio || null,
        phone: form.phone || null,
        publicContactEmail: form.publicContactEmail || null,
        location: form.location || null,
        resumeAssetId: form.resumeAssetId || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-muted" />
        </div>

        <div>
          <CardContent className="space-y-6 pt-6">
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-32 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Your portfolio could not be loaded.
          </p>
        </CardContent>
      </div>
    );
  }

  return (
    <div className=" w-full max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage the information people see on your portfolio.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Identity */}
      <div className="flex flex-col gap-4 ">
        <CardHeader>
          <CardTitle className="text-base">Identity</CardTitle>

          <p className="text-sm text-muted-foreground">
            Introduce yourself to people visiting your portfolio.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>

            <Input
              id="display-name"
              value={form.displayName}
              onChange={(event) =>
                updateField("displayName", event.target.value)
              }
              placeholder="Your name"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>

            <Input
              id="headline"
              value={form.headline}
              onChange={(event) => updateField("headline", event.target.value)}
              placeholder="Software Engineer"
              maxLength={150}
            />

            <p className="text-xs text-muted-foreground">
              A short description that appears below your name.
            </p>
          </div>
        </CardContent>
      </div>

      {/* About */}
      <div className="flex flex-col gap-4 ">
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>

          <p className="text-sm text-muted-foreground">
            Tell people a little about yourself.
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>

            <Textarea
              id="bio"
              value={form.bio}
              onChange={(event) => updateField("bio", event.target.value)}
              placeholder="Tell people about yourself, what you build, and what you care about."
              maxLength={5000}
              className="min-h-40 resize-y"
            />

            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground">
                {form.bio.length}/5000
              </span>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-4 ">
        <CardHeader>
          <CardTitle className="text-base">Contact</CardTitle>

          <p className="text-sm text-muted-foreground">
            Choose the contact information you want to make available through
            your portfolio.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="public-contact-email">Public email</Label>

            <Input
              id="public-contact-email"
              type="email"
              value={form.publicContactEmail}
              onChange={(event) =>
                updateField("publicContactEmail", event.target.value)
              }
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>

            <Input
              id="phone"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+91 ..."
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>

            <Input
              id="location"
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
              placeholder="Pune, India"
              maxLength={150}
            />
          </div>
        </CardContent>
      </div>

      {/* Resume */}
     <div className="flex flex-col gap-4 ">
        <CardHeader>
          <CardTitle className="text-base">Resume</CardTitle>

          <p className="text-sm text-muted-foreground">
            Attach a resume to your portfolio.
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            {form.resumeAssetId && (
              <p className="text-sm text-muted-foreground">
                A resume is currently attached.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => updateField("resumeAssetId", "")}
                >
                  Remove
                </button>
              </p>
            )}

            <DocumentUploader
              purpose="PORTFOLIO_RESUME"
              accept="application/pdf"
              onUploaded={(asset) => updateField("resumeAssetId", asset.id)}
            />

            <p className="text-xs text-muted-foreground">
              PDF only. Uploading a new resume replaces the current one once
              you save.
            </p>
          </div>
        </CardContent>
      </div>

      {/* Save */}
      <div className="flex justify-end pb-8">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !form.displayName.trim()}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
