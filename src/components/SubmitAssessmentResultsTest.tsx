import { useCallback, useMemo, useState } from "react";
import {
  AssessmentSubmissionClient,
  AssessmentSubmission,
  QuestionRole,
  validateSubmitAssessmentPayload,
  type SubmitAssessmentResultsPartnerPayload,
  type SubmitAssessmentResultsApiResult,
  type SubmittedSkillResultPayload,
} from "@superapp_men/submit-assessment-results";

const SAMPLE_PAYLOAD: SubmitAssessmentResultsPartnerPayload = {
  studentId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  partnerCode: "PARTNER001",
  attemptId: `attempt-${Date.now()}`,
  isAser: false,
  totalSkillsInWeek: 2,
  skills: [
    {
      skillCode: "MATH_ADD_01",
      skillOrder: 1,
      passed: true,
      questions: [
        {
          questionCode: "Q001",
          isCorrect: true,
          questionOrder: 1,
          questionRole: 2,
          responseTime: 5000,
        },
        {
          questionCode: "Q002",
          isCorrect: false,
          questionOrder: 2,
          questionRole: 2,
        },
      ],
    },
    {
      skillCode: "MATH_SUB_01",
      skillOrder: 2,
      passed: true,
      questions: [
        {
          questionCode: "Q003",
          isCorrect: true,
          questionOrder: 1,
          questionRole: 2,
        },
      ],
    },
  ],
};

type BuildMode = "json" | "builder";

interface BuilderQuestion {
  questionCode: string;
  isCorrect: boolean;
  questionOrder: number;
  questionRole: number;
  responseTime?: number | string;
  attemptsCount?: number;
  questionTextFr?: string;
  questionTextAr?: string;
}

interface BuilderSkill {
  skillCode: string;
  skillOrder: number;
  passed: boolean;
  titleFr?: string;
  titleAr?: string;
  descriptionFr?: string;
  descriptionAr?: string;
  questions: BuilderQuestion[];
}

const defaultBuilderSkill = (order: number): BuilderSkill => ({
  skillCode: `SKILL_${order}`,
  skillOrder: order,
  passed: true,
  questions: [
    {
      questionCode: "Q01",
      isCorrect: true,
      questionOrder: 1,
      questionRole: QuestionRole.VALIDATION,
    },
  ],
});

export function SubmitAssessmentResultsTest() {
  const [mode, setMode] = useState<BuildMode>("json");
  const [jsonInput, setJsonInput] = useState(() =>
    JSON.stringify(SAMPLE_PAYLOAD, null, 2)
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null);
  const [result, setResult] = useState<SubmitAssessmentResultsApiResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Builder mode state
  const [builderStudentId, setBuilderStudentId] = useState(
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  );
  const [builderPartnerCode, setBuilderPartnerCode] = useState("PARTNER001");
  const [builderAttemptId, setBuilderAttemptId] = useState(
    () => `attempt-${Date.now()}`
  );
  const [builderAser, setBuilderAser] = useState(false);
  const [builderTotalSkills, setBuilderTotalSkills] = useState(2);
  const [builderSkills, setBuilderSkills] = useState<BuilderSkill[]>(() => [
    defaultBuilderSkill(1),
    defaultBuilderSkill(2),
  ]);
  const [builtPayload, setBuiltPayload] =
    useState<SubmitAssessmentResultsPartnerPayload | null>(null);

  const client = useMemo(
    () =>
      new AssessmentSubmissionClient({
        timeout: 30000,
        debug: true,
      }),
    []
  );

  const loadSample = useCallback(() => {
    const sample = {
      ...SAMPLE_PAYLOAD,
      attemptId: `attempt-${Date.now()}`,
    };
    setJsonInput(JSON.stringify(sample, null, 2));
    setParseError(null);
    setValidationErrors(null);
    setResult(null);
  }, []);

  const parsePayload = useCallback((): SubmitAssessmentResultsPartnerPayload | null => {
    setParseError(null);
    setValidationErrors(null);
    try {
      const parsed = JSON.parse(jsonInput) as SubmitAssessmentResultsPartnerPayload;
      if (typeof parsed !== "object" || parsed === null) {
        setParseError("Payload must be a JSON object.");
        return null;
      }
      return parsed;
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
      return null;
    }
  }, [jsonInput]);

  const getPayloadToSubmit = useCallback((): SubmitAssessmentResultsPartnerPayload | null => {
    if (mode === "json") return parsePayload();
    return builtPayload;
  }, [mode, parsePayload, builtPayload]);

  const handleValidate = useCallback(() => {
    const payload = mode === "json" ? parsePayload() : builtPayload;
    if (payload === null) {
      if (mode === "builder") setValidationErrors(["Build the payload first."]);
      return;
    }
    const validation = validateSubmitAssessmentPayload(payload);
    if (validation.valid) {
      setValidationErrors(null);
      setResult(null);
      return;
    }
    setValidationErrors(
      validation.errors.map((e) => `${e.key}: ${e.message}`)
    );
  }, [mode, parsePayload, builtPayload]);

  const handleSubmit = useCallback(async () => {
    const payload = getPayloadToSubmit();
    if (payload === null) {
      if (mode === "builder") setValidationErrors(["Build the payload first."]);
      return;
    }
    setSubmitting(true);
    setResult(null);
    setValidationErrors(null);
    try {
      const apiResult = await client.submit(payload);
      setResult(apiResult);
    } catch (e) {
      setResult({
        ok: false,
        statusCode: 500,
        body: {
          detail: e instanceof Error ? e.message : "Request failed",
        },
      });
    } finally {
      setSubmitting(false);
    }
  }, [client, getPayloadToSubmit, mode]);

  // Build payload using the package's builder API
  const handleBuildWithBuilder = useCallback(() => {
    setValidationErrors(null);
    setParseError(null);
    try {
      const skillsPayload: SubmittedSkillResultPayload[] = builderSkills.map(
        (s) => {
          const sb = AssessmentSubmission.skill(
            s.skillCode,
            s.skillOrder,
            s.passed
          );
          if (s.titleFr !== undefined || s.titleAr !== undefined)
            sb.title(s.titleFr, s.titleAr);
          if (
            s.descriptionFr !== undefined ||
            s.descriptionAr !== undefined
          )
            sb.description(s.descriptionFr, s.descriptionAr);
          return sb
            .questions(
              s.questions.map((q) => {
                const qb = AssessmentSubmission.question(
                  q.questionCode,
                  q.isCorrect,
                  q.questionRole as QuestionRole
                ).order(q.questionOrder);
                if (q.responseTime != null) {
                  const rt =
                    typeof q.responseTime === "string"
                      ? q.responseTime
                      : q.responseTime;
                  qb.responseTime(rt);
                }
                if (q.attemptsCount != null) qb.attemptsCount(q.attemptsCount);
                if (
                  q.questionTextFr !== undefined ||
                  q.questionTextAr !== undefined
                )
                  qb.questionText(q.questionTextFr, q.questionTextAr);
                return qb.build();
              })
            )
            .build();
        }
      );

      const payload = AssessmentSubmission.builder()
        .setStudentId(builderStudentId)
        .setPartnerCode(builderPartnerCode)
        .setAttemptId(builderAttemptId)
        .setAser(builderAser)
        .setTotalSkillsInWeek(builderTotalSkills)
        .addSkills(skillsPayload)
        .build();

      setBuiltPayload(payload);
    } catch (e) {
      setValidationErrors([
        e instanceof Error ? e.message : "Builder failed",
      ]);
      setBuiltPayload(null);
    }
  }, [
    builderStudentId,
    builderPartnerCode,
    builderAttemptId,
    builderAser,
    builderTotalSkills,
    builderSkills,
  ]);

  const addBuilderSkill = useCallback(() => {
    setBuilderSkills((prev) => [
      ...prev,
      defaultBuilderSkill(prev.length + 1),
    ]);
    setBuilderTotalSkills((n) => n + 1);
  }, []);

  const updateBuilderSkill = useCallback(
    (index: number, patch: Partial<BuilderSkill>) => {
      setBuilderSkills((prev) =>
        prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
      );
    },
    []
  );

  const removeBuilderSkill = useCallback((index: number) => {
    setBuilderSkills((prev) => prev.filter((_, i) => i !== index));
    setBuilderTotalSkills((n) => Math.max(1, n - 1));
  }, []);

  const addBuilderQuestion = useCallback((skillIndex: number) => {
    setBuilderSkills((prev) =>
      prev.map((s, i) =>
        i === skillIndex
          ? {
              ...s,
              questions: [
                ...s.questions,
                {
                  questionCode: `Q${String(s.questions.length + 1).padStart(2, "0")}`,
                  isCorrect: true,
                  questionOrder: s.questions.length + 1,
                  questionRole: QuestionRole.VALIDATION,
                },
              ],
            }
          : s
      )
    );
  }, []);

  const updateBuilderQuestion = useCallback(
    (
      skillIndex: number,
      questionIndex: number,
      patch: Partial<BuilderQuestion>
    ) => {
      setBuilderSkills((prev) =>
        prev.map((s, i) =>
          i === skillIndex
            ? {
                ...s,
                questions: s.questions.map((q, qi) =>
                  qi === questionIndex ? { ...q, ...patch } : q
                ),
              }
            : s
        )
      );
    },
    []
  );

  const removeBuilderQuestion = useCallback(
    (skillIndex: number, questionIndex: number) => {
      setBuilderSkills((prev) =>
        prev.map((s, i) =>
          i === skillIndex
            ? {
                ...s,
                questions: s.questions.filter((_, qi) => qi !== questionIndex),
              }
            : s
        )
      );
    },
    []
  );

  const copyBuiltToJson = useCallback(() => {
    if (builtPayload) {
      setJsonInput(JSON.stringify(builtPayload, null, 2));
      setMode("json");
      setParseError(null);
      setValidationErrors(null);
    }
  }, [builtPayload]);

  const sectionStyle: React.CSSProperties = {
    marginBottom: "16px",
    padding: "12px",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    background: "#f8f9fa",
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: "16px", color: "#1a1a2e" }}>
        Submit assessment results (test)
      </h2>
      <p style={{ color: "#555", marginBottom: "16px", fontSize: "14px" }}>
        Build the payload in two ways: <strong>Direct JSON</strong> (paste/edit
        JSON) or <strong>Builder</strong> (form + package builder API). Then
        Validate and Submit (must run inside the SuperApp iframe).
      </p>

      {/* Mode tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <button
          type="button"
          onClick={() => setMode("json")}
          style={{
            ...btnStyle(mode === "json" ? "#0d6efd" : "#6c757d"),
            borderBottom: mode === "json" ? "2px solid #0d6efd" : "2px solid transparent",
            marginBottom: "-1px",
          }}
        >
          Direct JSON
        </button>
        <button
          type="button"
          onClick={() => setMode("builder")}
          style={{
            ...btnStyle(mode === "builder" ? "#0d6efd" : "#6c757d"),
            borderBottom:
              mode === "builder" ? "2px solid #0d6efd" : "2px solid transparent",
            marginBottom: "-1px",
          }}
        >
          Builder
        </button>
      </div>

      {mode === "json" && (
        <>
          <div style={{ marginBottom: "12px" }}>
            <label
              htmlFor="payload-json"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "6px",
                color: "#333",
              }}
            >
              Payload JSON
            </label>
            <textarea
              id="payload-json"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "studentId": "...", "partnerCode": "...", ... }'
              style={{
                width: "100%",
                minHeight: "220px",
                padding: "12px",
                fontFamily: "ui-monospace, monospace",
                fontSize: "13px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                resize: "vertical",
              }}
              spellCheck={false}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="button" onClick={loadSample} style={btnStyle("#6c757d")}>
              Load sample
            </button>
            <button
              type="button"
              onClick={handleValidate}
              style={btnStyle("#0d6efd")}
            >
              Validate
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                ...btnStyle(submitting ? "#adb5bd" : "#198754"),
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </>
      )}

      {mode === "builder" && (
        <>
          <div style={sectionStyle}>
            <strong style={{ display: "block", marginBottom: "8px" }}>
              Header
            </strong>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "10px",
              }}
            >
              <input
                type="text"
                placeholder="studentId (UUID)"
                value={builderStudentId}
                onChange={(e) => setBuilderStudentId(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="partnerCode"
                value={builderPartnerCode}
                onChange={(e) => setBuilderPartnerCode(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="attemptId"
                value={builderAttemptId}
                onChange={(e) => setBuilderAttemptId(e.target.value)}
                style={inputStyle}
              />
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={builderAser}
                  onChange={(e) => setBuilderAser(e.target.checked)}
                />
                isAser
              </label>
              <input
                type="number"
                min={1}
                placeholder="totalSkillsInWeek"
                value={builderTotalSkills}
                onChange={(e) =>
                  setBuilderTotalSkills(parseInt(e.target.value, 10) || 1)
                }
                style={inputStyle}
              />
            </div>
          </div>

          <div style={sectionStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <strong>Skills (built with AssessmentSubmission.skill / .question)</strong>
              <button
                type="button"
                onClick={addBuilderSkill}
                style={btnStyle("#0d6efd")}
              >
                Add skill
              </button>
            </div>
            {builderSkills.map((skill, sIdx) => (
              <div
                key={sIdx}
                style={{
                  marginBottom: "12px",
                  padding: "10px",
                  background: "#fff",
                  borderRadius: "6px",
                  border: "1px solid #dee2e6",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="skillCode"
                    value={skill.skillCode}
                    onChange={(e) =>
                      updateBuilderSkill(sIdx, { skillCode: e.target.value })
                    }
                    style={{ ...inputStyle, width: "120px" }}
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="order"
                    value={skill.skillOrder}
                    onChange={(e) =>
                      updateBuilderSkill(sIdx, {
                        skillOrder: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    style={{ ...inputStyle, width: "70px" }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <input
                      type="checkbox"
                      checked={skill.passed}
                      onChange={(e) =>
                        updateBuilderSkill(sIdx, { passed: e.target.checked })
                      }
                    />
                    passed
                  </label>
                  <button
                    type="button"
                    onClick={() => removeBuilderSkill(sIdx)}
                    style={btnStyle("#dc3545")}
                  >
                    Remove skill
                  </button>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="titleFr"
                    value={skill.titleFr ?? ""}
                    onChange={(e) =>
                      updateBuilderSkill(sIdx, {
                        titleFr: e.target.value || undefined,
                      })
                    }
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="titleAr"
                    value={skill.titleAr ?? ""}
                    onChange={(e) =>
                      updateBuilderSkill(sIdx, {
                        titleAr: e.target.value || undefined,
                      })
                    }
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="descriptionFr"
                    value={skill.descriptionFr ?? ""}
                    onChange={(e) =>
                      updateBuilderSkill(sIdx, {
                        descriptionFr: e.target.value || undefined,
                      })
                    }
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="descriptionAr"
                    value={skill.descriptionAr ?? ""}
                    onChange={(e) =>
                      updateBuilderSkill(sIdx, {
                        descriptionAr: e.target.value || undefined,
                      })
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginLeft: "12px" }}>
                  {skill.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="questionCode"
                        value={q.questionCode}
                        onChange={(e) =>
                          updateBuilderQuestion(sIdx, qIdx, {
                            questionCode: e.target.value,
                          })
                        }
                        style={{ ...inputStyle, width: "80px" }}
                      />
                      <label>
                        <input
                          type="checkbox"
                          checked={q.isCorrect}
                          onChange={(e) =>
                            updateBuilderQuestion(sIdx, qIdx, {
                              isCorrect: e.target.checked,
                            })
                          }
                        />{" "}
                        correct
                      </label>
                      <input
                        type="number"
                        min={1}
                        placeholder="order"
                        value={q.questionOrder}
                        onChange={(e) =>
                          updateBuilderQuestion(sIdx, qIdx, {
                            questionOrder: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        style={{ ...inputStyle, width: "56px" }}
                      />
                      <select
                        value={q.questionRole}
                        onChange={(e) =>
                          updateBuilderQuestion(sIdx, qIdx, {
                            questionRole: parseInt(e.target.value, 10),
                          })
                        }
                        style={inputStyle}
                      >
                        <option value={QuestionRole.POSITIONING}>
                          POSITIONING (1)
                        </option>
                        <option value={QuestionRole.VALIDATION}>
                          VALIDATION (2)
                        </option>
                        <option value={QuestionRole.REMEDIATION}>
                          REMEDIATION (3)
                        </option>
                        <option value={QuestionRole.BONUS}>BONUS (4)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="responseTime (ms or hh:mm:ss)"
                        value={q.responseTime ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          const num = parseInt(v, 10);
                          updateBuilderQuestion(sIdx, qIdx, {
                            responseTime:
                              v === ""
                                ? undefined
                                : Number.isNaN(num)
                                  ? v
                                  : num,
                          });
                        }}
                        style={{ ...inputStyle, width: "140px" }}
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="attemptsCount"
                        value={q.attemptsCount ?? ""}
                        onChange={(e) =>
                          updateBuilderQuestion(sIdx, qIdx, {
                            attemptsCount:
                              e.target.value === ""
                                ? undefined
                                : parseInt(e.target.value, 10) || 0,
                          })
                        }
                        style={{ ...inputStyle, width: "90px" }}
                      />
                      <input
                        type="text"
                        placeholder="questionTextFr"
                        value={q.questionTextFr ?? ""}
                        onChange={(e) =>
                          updateBuilderQuestion(sIdx, qIdx, {
                            questionTextFr:
                              e.target.value || undefined,
                          })
                        }
                        style={{ ...inputStyle, width: "100px" }}
                      />
                      <input
                        type="text"
                        placeholder="questionTextAr"
                        value={q.questionTextAr ?? ""}
                        onChange={(e) =>
                          updateBuilderQuestion(sIdx, qIdx, {
                            questionTextAr:
                              e.target.value || undefined,
                          })
                        }
                        style={{ ...inputStyle, width: "100px" }}
                      />
                      <button
                        type="button"
                        onClick={() => removeBuilderQuestion(sIdx, qIdx)}
                        style={btnStyle("#dc3545")}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addBuilderQuestion(sIdx)}
                    style={btnStyle("#6c757d")}
                  >
                    Add question
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
            <button
              type="button"
              onClick={handleBuildWithBuilder}
              style={btnStyle("#0d6efd")}
            >
              Build payload (builder API)
            </button>
            {builtPayload && (
              <>
                <button
                  type="button"
                  onClick={copyBuiltToJson}
                  style={btnStyle("#6c757d")}
                >
                  Copy to Direct JSON
                </button>
                <button
                  type="button"
                  onClick={handleValidate}
                  style={btnStyle("#0d6efd")}
                >
                  Validate
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    ...btnStyle(submitting ? "#adb5bd" : "#198754"),
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              </>
            )}
          </div>

          {builtPayload && (
            <div style={{ marginTop: "12px" }}>
              <strong style={{ display: "block", marginBottom: "6px" }}>
                Built payload (from builder)
              </strong>
              <textarea
                readOnly
                value={JSON.stringify(builtPayload, null, 2)}
                style={{
                  width: "100%",
                  minHeight: "180px",
                  padding: "12px",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  background: "#f8f9fa",
                }}
              />
            </div>
          )}
        </>
      )}

      {parseError && (
        <div
          style={{
            padding: "10px 12px",
            background: "#ffebee",
            color: "#c62828",
            borderRadius: "6px",
            marginTop: "12px",
            fontSize: "14px",
          }}
        >
          <strong>Parse error:</strong> {parseError}
        </div>
      )}

      {validationErrors && validationErrors.length > 0 && (
        <div
          style={{
            padding: "10px 12px",
            background: "#fff3e0",
            color: "#e65100",
            borderRadius: "6px",
            marginTop: "12px",
            fontSize: "14px",
          }}
        >
          <strong>Validation errors:</strong>
          <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px" }}>
            {validationErrors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "8px",
            background: result.ok ? "#d4edda" : "#f8d7da",
            color: result.ok ? "#155724" : "#721c24",
            border: `1px solid ${result.ok ? "#c3e6cb" : "#f5c6cb"}`,
          }}
        >
          <strong>
            {result.ok ? "Success" : "Error"} (HTTP {result.statusCode})
          </strong>
          <pre
            style={{
              marginTop: "8px",
              fontSize: "12px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: "10px 18px",
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  };
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ced4da",
  borderRadius: "6px",
  fontSize: "14px",
};
