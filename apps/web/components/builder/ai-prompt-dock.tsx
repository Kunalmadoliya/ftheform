"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  IconAi,
  IconCheck,
  IconEnter,
  IconRotateCcw,
  IconSpinner,
} from "~/components/icons/app-icons";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useAiGeneration } from "~/components/builder/use-ai-generation";

type MessageItem = {
  id: string;
  prompt: string;
  status: "pending" | "running" | "completed" | "failed";
  error?: string | null;
  createdAt: number;
};

type AiPromptDockProps = {
  formId: string;
};

export function AiPromptDock({ formId }: AiPromptDockProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const activeMessageIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    startGeneration,
    isGenerating,
    hasActiveJob,
    status,
    statusError,
  } = useAiGeneration({
    formId,
    onCompleted: () => {
      if (activeMessageIdRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === activeMessageIdRef.current ? { ...m, status: "completed" } : m,
          ),
        );
        activeMessageIdRef.current = null;
      }
      toast.success("Fields added to your form.");
    },
    onFailed: (err) => {
      if (activeMessageIdRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === activeMessageIdRef.current
              ? { ...m, status: "failed", error: err || "Generation failed." }
              : m,
          ),
        );
        activeMessageIdRef.current = null;
      }
      toast.error(err || "AI generation failed.");
    },
    onTimedOut: () => {
      if (activeMessageIdRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === activeMessageIdRef.current
              ? { ...m, status: "failed", error: "Generation timed out." }
              : m,
          ),
        );
        activeMessageIdRef.current = null;
      }
      toast.warning("Generation took longer than expected.");
    },
  });

  // Keep message status in sync if status moves to running
  useEffect(() => {
    if (activeMessageIdRef.current && status === "running") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === activeMessageIdRef.current && m.status !== "running"
            ? { ...m, status: "running" }
            : m,
        ),
      );
    }
  }, [status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const trimmedLength = prompt.trim().length;
  const isValidLength = trimmedLength >= 8 && trimmedLength <= 2000;
  const isBusy = isGenerating || hasActiveJob;

  async function triggerGeneration(text: string) {
    const cleanText = text.trim();
    if (cleanText.length < 8 || cleanText.length > 2000 || isBusy) return;

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    activeMessageIdRef.current = messageId;

    const newMsg: MessageItem = {
      id: messageId,
      prompt: cleanText,
      status: "pending",
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setPrompt("");

    try {
      await startGeneration({ formId, prompt: cleanText });
    } catch {
      // error handled by useAiGeneration / onFailed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: "failed", error: "Unable to start generation." } : m,
        ),
      );
      activeMessageIdRef.current = null;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void triggerGeneration(prompt);
  }

  return (
    <div className="flex flex-col border-t border-border bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight text-foreground">
          <IconAi className="size-3.5 text-foreground" />
          <span>AI Assistant</span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          History resets on refresh
        </span>
      </div>

      {/* Message List */}
      <div className="max-h-52 min-h-20 overflow-y-auto p-3 space-y-2.5 text-xs">
        {messages.length === 0 ? (
          <div className="py-3 text-center">
            <p className="text-[11px] text-muted-foreground">
              Describe questions or sections you want to add.
            </p>
          </div>
        ) : (
          messages.map((item) => (
            <div key={item.id} className="space-y-1 rounded-[var(--radius)] border border-border/80 bg-background p-2.5">
              <p className="text-xs text-foreground leading-relaxed line-clamp-3">{item.prompt}</p>
              <div className="flex items-center justify-between pt-1 font-mono text-[10px]">
                {item.status === "pending" ? (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <IconSpinner className="size-3 animate-spin text-foreground" />
                    Pending...
                  </span>
                ) : item.status === "running" ? (
                  <span className="flex items-center gap-1 text-foreground">
                    <IconSpinner className="size-3 animate-spin text-foreground" />
                    Generating fields...
                  </span>
                ) : item.status === "completed" ? (
                  <span className="flex items-center gap-1 text-foreground font-medium">
                    <IconCheck className="size-3 text-foreground" />
                    Fields added
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-destructive">
                    <span>{item.error || "Failed"}</span>
                  </span>
                )}

                {item.status === "failed" && !isBusy ? (
                  <button
                    type="button"
                    onClick={() => void triggerGeneration(item.prompt)}
                    className="inline-flex items-center gap-1 text-foreground underline hover:text-foreground/80 cursor-pointer"
                  >
                    <IconRotateCcw className="size-2.5" />
                    Retry
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-border/60 p-3">
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (isValidLength && !isBusy) {
                  void triggerGeneration(prompt);
                }
              }
            }}
            placeholder="E.g. Add 3 rating questions about customer service..."
            rows={2}
            disabled={isBusy}
            className="resize-none pr-10 text-xs leading-relaxed"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!isValidLength || isBusy}
            className="absolute bottom-2 right-2 size-6"
            aria-label="Send prompt to AI"
          >
            {isBusy ? (
              <IconSpinner className="size-3 animate-spin" />
            ) : (
              <IconEnter className="size-3" />
            )}
          </Button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Min 8 chars • Enter to send</span>
          <span className="font-mono">{trimmedLength} / 2000</span>
        </div>
      </form>
    </div>
  );
}
