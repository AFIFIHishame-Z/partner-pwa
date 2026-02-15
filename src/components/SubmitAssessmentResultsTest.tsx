import { useCallback, useMemo, useState } from "react";
import {
  AssessmentSubmissionClient,
  validateSubmitAssessmentPayload,
  type SubmitAssessmentResultsPartnerPayload,
  type SubmitAssessmentResultsApiResult,
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
          questionRole: 2, // VALIDATION
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

export function SubmitAssessmentResultsTest() {
  const [jsonInput, setJsonInput] = useState(() =>
    JSON.stringify(SAMPLE_PAYLOAD, null, 2)
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[] | null>(
    null
  );
  const [result, setResult] = useState<SubmitAssessmentResultsApiResult | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

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

  const handleValidate = useCallback(() => {
    const payload = parsePayload();
    if (payload === null) return;
    const validation = validateSubmitAssessmentPayload(payload);
    if (validation.valid) {
      setValidationErrors(null);
      setResult(null);
      return;
    }
    setValidationErrors(
      validation.errors.map((e) => `${e.key}: ${e.message}`)
    );
  }, [parsePayload]);

  const handleSubmit = useCallback(async () => {
    const payload = parsePayload();
    if (payload === null) return;
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
  }, [client, parsePayload]);

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "720px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: "16px", color: "#1a1a2e" }}>
        Submit assessment results (test)
      </h2>
      <p style={{ color: "#555", marginBottom: "16px", fontSize: "14px" }}>
        Paste or edit the payload JSON below. Use &quot;Load sample&quot; to
        fill a valid example, then &quot;Validate&quot; to check locally, and
        &quot;Submit&quot; to send to the SuperApp (must run inside the
        SuperApp iframe).
      </p>

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

      {parseError && (
        <div
          style={{
            padding: "10px 12px",
            background: "#ffebee",
            color: "#c62828",
            borderRadius: "6px",
            marginBottom: "12px",
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
            marginBottom: "12px",
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

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={loadSample}
          style={btnStyle("#6c757d")}
        >
          Load sample
        </button>
        <button type="button" onClick={handleValidate} style={btnStyle("#0d6efd")}>
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
