import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check } from "lucide-react";

import AppHeader from "./AppHeader";

import { useGetQuestions, ApiQuestion } from "./services/useGetQuestions";
import { useGetQuestionnaire, getSavedQuestionnaireId } from "./services/useGetQuestionnaire";
import { postQuestionnaireAnswer, QuestionnaireProgress } from "./services/questionnaireAnswer";
import { completeQuestionnaire } from "./services/completeQuestionnaire";

type AnswersMap = Record<number, any>;

const STORAGE_KEY = "mezo_hair_profile_answers";

const HairProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const lang = "ar";

  const qHook = useGetQuestionnaire(lang, true);
  const questionnaireId = qHook.questionnaireId ?? getSavedQuestionnaireId();

  const { questions, requiredIds, isLoading, isFetching } = useGetQuestions(lang, true);

  const [answers, setAnswers] = useState<AnswersMap>({});
  const [errors, setErrors] = useState<Set<number>>(new Set());
  const [serverProgress, setServerProgress] = useState<QuestionnaireProgress | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const textTimers = useRef<Record<number, any>>({});
  const completionTriggeredRef = useRef(false);
  const lastSubmittedTextRef = useRef<Record<number, string>>({});
  const persistTimerRef = useRef<any>(null);

  const textAreaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
  const focusedTextIdRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch { }
    }
  }, []);

  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);

    persistTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      } catch { }
    }, 800);

    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [answers]);

  useEffect(() => {
    const id = focusedTextIdRef.current;
    if (!id) return;

    const el = textAreaRefs.current[id];
    if (!el) return;

    if (document.activeElement !== el) {
      try {
        el.focus({ preventScroll: true } as any);
      } catch {
        el.focus();
      }
    }
  }, [answers]);

  const clearErrorIfExists = (questionId: number) => {
    setErrors((prev) => {
      if (!prev.has(questionId)) return prev;
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  };

  const setAnswerLocal = (questionId: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    clearErrorIfExists(questionId);
  };

  const maybeComplete = async (progress: QuestionnaireProgress | null | undefined) => {
    if (!questionnaireId) return;
    if (!progress) return;

    const done =
      progress.is_complete === true ||
      (progress.answered != null && progress.total != null && progress.answered >= progress.total);

    if (!done) return;
    if (completionTriggeredRef.current) return;

    completionTriggeredRef.current = true;
    await completeQuestionnaire(questionnaireId, lang);
  };

  const submitAnswer = async (q: ApiQuestion, value: any) => {
    if (!questionnaireId) return;

    if (q.type === "text") {
      const txt = String(value ?? "").trim();
      if (!txt) return;
      if (!txt) return;

      const res = await postQuestionnaireAnswer(
        questionnaireId,
        { question_id: q.id, text_answer: txt },
        lang
      );

      if (res.ok) {
        setServerProgress(res.data.progress);
        await maybeComplete(res.data.progress);
      }
      return;
    }

    if (q.type === "multiple_choice") {
      if (value == null || value === "") return;

      const res = await postQuestionnaireAnswer(
        questionnaireId,
        { question_id: q.id, answer_id: Number(value) },
        lang
      );

      if (res.ok) {
        setServerProgress(res.data.progress);
        await maybeComplete(res.data.progress);
      }
      return;
    }
  };

  const validate = () => {
    const newErrors = new Set<number>();

    for (const q of questions) {
      // if (q.is_required !== 1) continue;

      const v = answers[q.id];

      if (q.type === "text") {
        if (!v || String(v).trim().length === 0) newErrors.add(q.id);
      } else if (q.type === "multiple_choice") {
        if (v == null || v === "") newErrors.add(q.id);
      } else {
        if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) newErrors.add(q.id);
      }
    }

    setErrors(newErrors);
    return newErrors.size === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);

    if (questionnaireId && serverProgress?.is_complete) {
      await maybeComplete(serverProgress);
    }

    setTimeout(() => {
      setIsSaving(false);
      navigate("/account", { state: { profileSaved: true } });
    }, 350);
  };

  const QuestionCard: React.FC<{ q: ApiQuestion }> = ({ q }) => {
    const required = 1;
    const hasError = errors.has(q.id);

    if (q.type === "text") {
      const v = answers[q.id] ?? "";

      return (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-app-text mb-2">
            {q.question} {required && <span className="text-red-500">*</span>}
          </label>

          <textarea
            ref={(el) => {
              textAreaRefs.current[q.id] = el;
            }}
            className="w-full p-4 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-sm h-32 leading-relaxed"
            value={v}
            onFocus={() => {
              focusedTextIdRef.current = q.id;
            }}
            onChange={(e) => {
              const next = e.target.value;
              setAnswerLocal(q.id, next);

              if (textTimers.current[q.id]) clearTimeout(textTimers.current[q.id]);

              textTimers.current[q.id] = setTimeout(() => {
                const txt = String(next ?? "").trim();
                const last = lastSubmittedTextRef.current[q.id] ?? "";

                if (!txt) return;
                if (txt === last) return;

                submitAnswer(q, next);
                lastSubmittedTextRef.current[q.id] = txt;
              }, 3000);
            }}
            onBlur={(e) => {
              const nextEl = (e.relatedTarget as HTMLElement) || null;

              if (!nextEl) {
                setTimeout(() => {
                  const el = textAreaRefs.current[q.id];
                  if (el && document.activeElement === el) return;

                  if (textTimers.current[q.id]) clearTimeout(textTimers.current[q.id]);

                  const current = String(answers[q.id] ?? "").trim();
                  const last = lastSubmittedTextRef.current[q.id] ?? "";

                  if (!current) return;
                  if (!current) return;
                  if (current === last) return;

                  submitAnswer(q, answers[q.id]);
                  lastSubmittedTextRef.current[q.id] = current;
                  focusedTextIdRef.current = null;
                }, 50);
                return;
              }

              if (textTimers.current[q.id]) clearTimeout(textTimers.current[q.id]);

              const current = String(answers[q.id] ?? "").trim();
              const last = lastSubmittedTextRef.current[q.id] ?? "";

              if (!current) return;
              if (!current) return;
              if (current === last) return;

              submitAnswer(q, answers[q.id]);
              lastSubmittedTextRef.current[q.id] = current;
              focusedTextIdRef.current = null;
            }}
            placeholder="اكتبي هنا..."
          />

          {hasError && (
            <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={10} /> هذا الحقل مطلوب
            </p>
          )}
        </div>
      );
    }

    if (q.type === "multiple_choice") {
      const selectedAnswerId = answers[q.id];
      const opts = (q.answers ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      return (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-app-text mb-3">
            {q.question} {required && <span className="text-red-500">*</span>}
          </label>

          <div className="space-y-2">
            {opts.map((opt) => {
              const active = selectedAnswerId === opt.id;

              return (
                <label
                  key={opt.id}
                  className={`flex items-center p-4 rounded-2xl border transition-all cursor-pointer ${active ? "border-app-gold bg-app-gold/5 shadow-sm" : "border-app-card/50 bg-white"
                    }`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    name={`q_${q.id}`}
                    checked={active}
                    onChange={async () => {
                      setAnswerLocal(q.id, opt.id);
                      await submitAnswer(q, opt.id);
                    }}
                  />

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 ${active ? "border-app-gold" : "border-app-textSec/30"
                      }`}
                  >
                    {active && <div className="w-2.5 h-2.5 bg-app-gold rounded-full" />}
                  </div>

                  <span className={`text-xs font-normal ${active ? "text-app-gold" : "text-app-text"}`}>
                    {opt.answer}
                  </span>
                </label>
              );
            })}
          </div>

          {hasError && (
            <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={10} /> هذا الحقل مطلوب
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  const answeredRequiredLocal = useMemo(() => {
    let c = 0;
    for (const id of requiredIds) {
      const v = answers[id];
      if (v == null) continue;
      if (typeof v === "string" && v.trim() === "") continue;
      if (Array.isArray(v) && v.length === 0) continue;
      c++;
    }
    return c;
  }, [answers, requiredIds]);

  const headerProgressText = useMemo(() => {
    if (isLoading || isFetching) return "تحميل الأسئلة...";
    if (!questionnaireId) return "جاري تجهيز الاستبيان...";

    if (serverProgress?.answered != null && serverProgress?.total != null) {
      return `تمت الإجابة: ${serverProgress.answered} / ${serverProgress.total} (${(serverProgress.percentage ?? 0).toFixed(0)}%)`;
    }

    return `تمت الإجابة: ${answeredRequiredLocal} / ${requiredIds.length}`;
  }, [isLoading, isFetching, questionnaireId, serverProgress, answeredRequiredLocal, requiredIds.length]);

  return (
    <div className="flex flex-col h-full bg-app-bg relative font-alexandria overflow-hidden min-h-screen">
      <AppHeader title="ملف العناية بالفروة و الشعر" onBack={() => navigate("/account")} />

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 pt-24 pb-32 overscroll-contain">
        <div className="bg-white rounded-[2rem] p-6 mb-6 shadow-sm border border-app-card/30">
          <p className="text-[11px] text-app-textSec leading-loose text-center">
            يرجى تعبئة جميع البيانات المطلوبة بدقة لنتمكن من تقديم أفضل استشارة وعناية مخصصة.
          </p>

          <div className="mt-4 text-center text-[10px] font-semibold text-app-textSec/70">{headerProgressText}</div>

          {serverProgress?.is_complete && (
            <div className="mt-3 text-center text-[11px] font-semibold text-green-600">✅ تم إكمال الاستبيان</div>
          )}
        </div>

        {(isLoading || isFetching) && questions.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30 text-center text-sm text-app-textSec">
            جاري تحميل الأسئلة...
          </div>
        ) : (
          questions.map((q) => <QuestionCard key={q.id} q={q} />)
        )}
      </main>

      <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-app-card/30 z-40">
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading || isFetching}
          className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSaving ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check size={18} />
              حفظ
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default HairProfilePage;
