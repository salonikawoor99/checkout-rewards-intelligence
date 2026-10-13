const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 1200;

app.use(express.json({ limit: "50kb" }));

// Serve the prototype from public/index.html.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Health check.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

function getErrorStatus(error) {
  const status = Number(error?.status || error?.statusCode);
  return Number.isFinite(status) && status > 0 ? status : null;
}

function isRetryableError(error) {
  const status = getErrorStatus(error);

  if ([408, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  const message = String(error?.message || "");

  return (
    /\b503\b/.test(message) ||
    /\b429\b/.test(message) ||
    /UNAVAILABLE|RESOURCE_EXHAUSTED|INTERNAL/i.test(message)
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSafeErrorMessage(error) {
  const status = getErrorStatus(error);

  if (status === 429) {
    return "The AI service is receiving too many requests. Please wait briefly and try again.";
  }

  if ([500, 502, 503, 504].includes(status)) {
    return "The AI service is temporarily unavailable. Please try again shortly.";
  }

  if (status === 401 || status === 403) {
    return "The AI service rejected the request. Check the API key and its permissions.";
  }

  if (status === 400) {
    return "The AI service rejected the request. Check the model configuration and request.";
  }

  return "The AI recommendation could not be generated. Please try again.";
}

app.post("/api/strategy", async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error:
        "Gemini API key is not configured. Check your environment variables.",
      retryable: false,
    });
  }

  const {
    merchantName,
    industry,
    productCategory,
    averageOrderValue,
    grossMargin,
    customerMix,
    goal,
    syntheticInsights,
    merchantConstraints,
  } = req.body || {};

  if (!merchantName || !goal) {
    return res.status(400).json({
      error: "Merchant name and business goal are required.",
      retryable: false,
    });
  }

  // Construct the prompt from individual strings to avoid
  // multiline template-literal parsing issues.
  const prompt = [
    "You are an AI adviser for a merchant checkout rewards product.",
    "Recommend a practical, testable reward strategy aligned with the merchant's explicitly stated business goal.",
    "",
    "Important:",
    "- All provided cohort insights are synthetic and illustrative.",
    "- Do not invent statistics or claim causation.",
    "- Do not describe synthetic patterns as established customer behaviour.",
    "- Do not claim a reward has been activated.",
    "- The merchant must review and approve every proposed action.",
    "- Protect gross margin and monitor checkout conversion.",
    "- Match the primary success metric to the merchant's goal.",
    "- For repeat purchases, prioritise repeat-purchase rate and incremental repeat purchases; do not use AOV as the primary metric.",
    "- For AOV, prioritise average order value.",
    "- Explain uncertainty and recommend a control group where feasible.",
    "- Treat merchant constraints as requirements to consider.",
    "",
    "Merchant:",
    `Name: ${String(merchantName).slice(0, 120)}`,
    `Industry: ${String(industry || "Not supplied").slice(0, 120)}`,
    `Product category: ${String(productCategory || "Not supplied").slice(0, 120)}`,
    `Average order value: ${String(averageOrderValue || "Not supplied").slice(0, 50)}`,
    `Gross margin: ${String(grossMargin || "Not supplied").slice(0, 50)}`,
    `Customer mix: ${String(customerMix || "Not supplied").slice(0, 120)}`,
    `Goal: ${String(goal).slice(0, 120)}`,
    `Illustrative insights: ${JSON.stringify(syntheticInsights || {}).slice(0, 3000)}`,
    `Constraints: ${String(merchantConstraints || "Protect gross margin.").slice(0, 1500)}`,
    "",
    "Return concise sections:",
    "1. Recommended strategy",
    "2. Why it fits",
    "3. Target audience",
    "4. Reward and suggested basket threshold",
    "5. Margin and conversion risks",
    "6. Test duration and control group",
    "7. Primary and guardrail metrics",
    "8. Evidence needed to continue, change, or stop",
    "",
    "Be specific, cautious, and commercially practical.",
  ].join("\n");

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    let response;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(
          `Sending strategy request to model: ${model} (attempt ${attempt}/${MAX_ATTEMPTS})`
        );

        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 1200,
          },
        });

        break;
      } catch (error) {
        const retryable = isRetryableError(error);
        const hasAttemptsLeft = attempt < MAX_ATTEMPTS;

        console.error("Gemini request failed:", {
          attempt,
          status: getErrorStatus(error),
          name: error?.name || "UnknownError",
          retryable,
          message: String(error?.message || error).slice(0, 500),
        });

        if (!retryable || !hasAttemptsLeft) {
          throw error;
        }

        const delay = INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1);

        console.log(`Temporary AI failure. Retrying in ${delay}ms.`);
        await wait(delay);
      }
    }

    const strategy = response?.text;

    if (!strategy || !strategy.trim()) {
      console.error("Gemini returned an empty strategy response.");

      return res.status(502).json({
        error:
          "The AI service returned an empty recommendation. Please try again.",
        retryable: true,
      });
    }

    return res.json({
      strategy,
      source: "Gemini API",
      dataNotice: "Cohort insights are synthetic and illustrative.",
      activationStatus: "No live reward activated.",
    });
  } catch (error) {
    const status = getErrorStatus(error);
    const retryable = isRetryableError(error);

    console.error("Strategy generation failed after retry handling:", {
      status,
      name: error?.name || "UnknownError",
      message: String(error?.message || error).slice(0, 500),
    });

    return res.status(502).json({
      error: getSafeErrorMessage(error),
      retryable,
      providerStatus: status,
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Checkout Rewards backend running on port ${PORT}`);
});

server.on("error", (error) => {
  console.error("Server startup error:", error.message);
});

server.on("close", () => {
  console.log("The HTTP server has closed.");
});

process.on("uncaughtException", (error) => {
  console.error("Unexpected server error:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});