"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PersonaCard, PersonaCardSkeleton } from "@/components/voice/persona-card";
import { PersonaDetail, PersonaDetailSkeleton } from "@/components/voice/persona-detail";
import { AnalyzeDialog } from "@/components/voice/analyze-dialog";
import {
  getVoicePersonas,
  updateVoicePersona,
  deleteVoicePersona,
  type VoicePersona,
} from "@/lib/api";

export default function VoicePage() {
  const [personas, setPersonas] = useState<VoicePersona[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getVoicePersonas();
      if (res.success) {
        setPersonas(res.data.personas);
        setTotal(res.data.total);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load voice profiles";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  function handleSelectPersona(persona: VoicePersona) {
    setSelectedPersona(persona);
  }

  async function handleSetDefault(id: string) {
    setDetailLoading(true);
    try {
      await updateVoicePersona(id, { is_default: true });
      // Update local state
      setPersonas((prev) =>
        prev.map((p) => ({
          ...p,
          is_default: p.id === id,
        }))
      );
      // Update selected persona if it matches
      setSelectedPersona((prev) =>
        prev ? { ...prev, is_default: prev.id === id } : prev
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to set default";
      setError(message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteVoicePersona(id);
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
      if (selectedPersona?.id === id) {
        setSelectedPersona(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete persona";
      setError(message);
    }
  }

  function handleAnalysisComplete() {
    fetchPersonas();
  }

  function renderEmpty() {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted-foreground mb-4"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" x2="12" y1="19" y2="22" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="text-lg font-semibold mb-1">No voice profiles yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Analyze a website to extract writing style signals and automatically
            generate voice personas from the corpus.
          </p>
          <AnalyzeDialog onComplete={handleAnalysisComplete} />
        </CardContent>
      </Card>
    );
  }

  function renderError() {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchPersonas}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voice Profiles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage writing style personas extracted from your content corpus
          </p>
        </div>
        {personas.length > 0 && (
          <div className="flex items-center gap-2">
            <AnalyzeDialog onComplete={handleAnalysisComplete} />
          </div>
        )}
      </div>

      {/* Error state */}
      {error && !loading && renderError()}

      {/* Loading state */}
      {loading && <PersonaCardSkeleton />}

      {/* Empty state */}
      {!loading && !error && personas.length === 0 && renderEmpty()}

      {/* Content */}
      {!loading && !error && personas.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Grid of persona cards */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {personas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  selected={selectedPersona?.id === persona.id}
                  onSelect={handleSelectPersona}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </div>
            {total > personas.length && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Showing {personas.length} of {total} voice profiles
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedPersona && (
            <div className="lg:w-96 lg:shrink-0">
              <Card className="sticky top-20">
                <CardContent>
                  {detailLoading ? (
                    <PersonaDetailSkeleton />
                  ) : (
                    <PersonaDetail
                      persona={selectedPersona}
                      onSetDefault={handleSetDefault}
                      onDelete={handleDelete}
                      onClose={() => setSelectedPersona(null)}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
