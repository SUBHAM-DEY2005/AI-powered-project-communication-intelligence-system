import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  listCommunications,
  createCommunication,
  analyzeCommunication,
  deleteCommunication,
} from "../services/api.js";
import { LoadingState, EmptyState, ErrorState } from "../components/States.jsx";
import { PageHeader, Panel } from "../components/Cards.jsx";
import { useToast } from "../hooks/useToast.jsx";

// Browser's built-in speech recognition (free, no API key). Chrome/Edge only.
const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function Communication() {
  const { projectId } = useParams();
  const [text, setText] = useState("");
  const [comms, setComms] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const toast = useToast();

  const load = async () => {
    try {
      setError(null);
      const data = await listCommunications(projectId);
      setComms(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  useEffect(() => {
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setText((prev) => (prev ? prev.trim() + " " + finalTranscript : finalTranscript));
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        toast.error(`Voice input error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = () => {
    if (!SpeechRecognitionAPI) {
      toast.error("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    if (!text.trim()) {
      toast.error("Paste or dictate some communication text first");
      return;
    }
    setSubmitting(true);
    try {
      const comm = await createCommunication(projectId, text);
      setText("");
      await load();
      toast.success("Communication saved. Click Analyze to extract details.");
      // Auto-trigger analysis for a smoother demo flow
      handleAnalyze(comm.id);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalyze = async (id) => {
    setAnalyzingId(id);
    try {
      await analyzeCommunication(id);
      toast.success("Analysis complete");
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = async (comm) => {
    const preview = comm.text.length > 60 ? comm.text.slice(0, 60) + "…" : comm.text;
    if (
      !window.confirm(
        `Delete this communication?\n\n"${preview}"\n\nThis also removes any tasks and decisions extracted from it.`
      )
    ) {
      return;
    }
    try {
      await deleteCommunication(comm.id);
      toast.success("Communication deleted");
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Communication"
        subtitle="Paste or dictate a message, email snippet, or meeting note. AI extracts tasks, responsibilities, deadlines, and decisions."
      />

      <Panel className="mb-6">
        <form onSubmit={submit}>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder='e.g. "Rahul, please update the electrical drawing by Friday. The client approved the new lighting layout, but we still need approval for the ceiling design."'
              className="w-full border border-line rounded px-3 py-2 pr-14 text-sm focus:border-amber resize-none"
            />
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Stop dictation" : "Start dictation"}
              aria-pressed={isListening}
              className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                isListening
                  ? "bg-clay text-white shadow-[0_0_0_4px_rgba(181,73,59,0.15)]"
                  : "bg-paper-dim text-ink-soft hover:bg-amber/15 hover:text-amber-dark"
              }`}
            >
              {isListening && (
                <span className="absolute inset-0 rounded-full bg-clay/40 animate-ping" />
              )}
              <svg
                className="relative w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
          {isListening && (
            <p className="text-xs text-clay mt-1.5 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-clay animate-pulse" />
              Listening… speak your update, then click the mic again to stop.
            </p>
          )}
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-ink text-paper text-sm font-medium px-4 py-2 rounded hover:bg-ink-light disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Analyze Communication"}
            </button>
          </div>
        </form>
      </Panel>

      {error && <ErrorState message={error} />}
      {!error && comms === null && <LoadingState label="Loading history..." />}

      {comms && comms.length === 0 && (
        <EmptyState
          title="No communication logged yet"
          description="Whatever you paste or dictate above becomes searchable project memory."
        />
      )}

      {comms && comms.length > 0 && (
        <div className="space-y-4">
          {comms.map((c) => (
            <Panel key={c.id}>
              <p className="text-sm text-ink whitespace-pre-wrap">{c.text}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                <p className="text-xs text-ink-soft font-mono">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
                <div className="flex items-center gap-4">
                  {c.analyzed ? (
                    <span className="text-xs text-moss font-medium">
                      Analyzed — {c.summary}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAnalyze(c.id)}
                      disabled={analyzingId === c.id}
                      className="text-xs text-amber-dark font-medium hover:underline disabled:opacity-50"
                    >
                      {analyzingId === c.id ? "Analyzing..." : "Analyze now"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(c)}
                    title="Delete communication"
                    className="text-ink-soft hover:text-clay transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}