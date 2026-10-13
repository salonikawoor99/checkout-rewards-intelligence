# AI Build Log — Checkout Rewards Intelligence

**Challenge:** Razorpay AI PM Build Challenge — Track 2: Recover and Grow with AI  
**Prototype:** [Checkout Rewards Intelligence](https://checkout-rewards-intelligence.vercel.app/)  
**Status:** Concept prototype using synthetic data; no live rewards are activated.

## 1. AI tools and models used

- **ChatGPT (OpenAI):** Product framing, prioritisation, interaction design, implementation planning, debugging support, UI iteration, and preparation of submission materials.
- **Google Gemini via the `@google/genai` SDK:** Generates a merchant-specific reward strategy from the merchant context and selected growth goal.
- **Implementation:** A web prototype with HTML/CSS/JavaScript in `public/index.html`, a Node.js/Express backend in `server.js`, and deployment on Vercel.

The deployed prototype was configured to use `gemini-3.5-flash-lite` through the `GEMINI_MODEL` environment variable. No API keys or credentials are included in this log.

## 2. Key workflow, prompts, and AI setup

The product workflow is:

1. Collect merchant context: business name, industry, product category, typical order-value band, approximate gross-margin band, customer mix, and growth goal.
2. Show illustrative cohort and reward-pattern insights. These scores and cohort counts are synthetic examples, not measured merchant benchmarks.
3. Send the merchant context and goal to Gemini to draft a tailored reward strategy.
4. Present the generated recommendation in two views: a visual experiment blueprint and readable text sections. Switching views should reuse the existing response rather than call Gemini again.
5. Let the merchant review and adjust the proposed audience, reward approach, basket threshold, duration, and guardrails before approving a test plan.
6. Show simulated experiment results based on prototype assumptions. The prototype does not activate a reward or modify a live checkout.

The core instruction to the strategy-generation model was to produce a tailored, actionable reward experiment based on the merchant's profile and stated goal, including the recommended reward, eligible audience, rationale, test design, primary metric, guardrails, risks, and implementation considerations. The UI then structures the returned strategy into the visual blueprint and text cards.

Development workflow: use ChatGPT to iterate on requirements, UX, and code; implement and deploy the changes; inspect the deployed flow; and use screenshots to verify that the content, visual presentation, and simulated results match the intended scenario. Gemini generation was treated as a limited resource, so UI-only changes were made without intentionally triggering additional strategy-generation calls.

## 3. An AI output that was corrected or significantly improved

The first deployed Strategy “Visuals” view was too text-heavy and resembled a set of content cards rather than an experiment blueprint. It also showed a temporary local preview while Gemini was loading, which could be mistaken for the generated strategy if its status was overlooked.

I revised the presentation so the actual Gemini response is transformed into a clearer experiment flow:

**Identify eligible shoppers → Show the reward → Compare test and control outcomes**

The revised blueprint makes the proposed threshold and test duration visible, separates primary success metrics from guardrails, shows test versus control, and includes launch checks and risks. The Text view remains available for readable sections. The interface labels the generated response and preview states so users can distinguish AI-generated content from temporary preview content.

Why: the purpose is to help a merchant move from an insight to a reviewable experiment, not simply read a long AI response. Visuals and Text should communicate the same recommendation in different formats, and changing views should not generate another model response.

## 4. What AI did versus what I decided and built

**AI-assisted work**
- ChatGPT helped explore and refine the problem framing, user journey, feature scope, copy, interface iterations, implementation steps, and debugging approach.
- Gemini generated the merchant-specific strategy narrative and experiment recommendations from the supplied profile and goal.
- ChatGPT helped interpret screenshots and identify mismatches between the intended and deployed experience.

**My product and implementation decisions**
- Chose the Track 2 problem: helping merchants choose and evaluate checkout rewards for a measurable growth opportunity.
- Defined merchant control as a product principle: recommendations must be reviewable; the prototype must not silently activate a reward.
- Chose the input fields, growth goals, reward strategy workflow, visual/text modes, approval step, experiment guardrails, and simulation boundary.
- Decided to label insights as synthetic and results as simulated instead of implying that the prototype has validated market effects.
- Reviewed deployed screens and directed corrections when the experience did not match the intended experiment blueprint.
- Built and iterated on the prototype code and deployment workflow, using AI as a development partner rather than delegating product judgment entirely to a model.

## 5. Known limitations, risks, and verification steps

- **Synthetic insights:** The cohort size and relative reward scores are illustrative. They are not actual Razorpay merchant data, causal findings, or market benchmarks.
- **Generated strategy:** Gemini can produce plausible but unverified recommendations. Output should be reviewed for fit, feasibility, reward economics, eligibility, and consistency with the merchant's goal.
- **Simulated results:** Results are calculated from prototype assumptions, not from a live experiment. They must not be presented as observed uplift or a forecast validated on production data.
- **No live execution:** The prototype does not activate rewards, modify checkout, or execute a real A/B test.
- **Privacy and permissions:** A production version would require authorised data access, aggregation and privacy protections, eligibility rules, and controls against exposing other merchants' identities.
- **Economic and experiment risk:** A higher average order value can still reduce contribution if reward cost is too high or conversion declines. A production test should compare treatment with a suitable randomized control, define minimum sample-size and duration requirements, and monitor contribution and conversion guardrails.
- **Model and service reliability:** Model availability, quotas, latency, and output quality can vary. The backend model is configured through an environment variable; secrets belong in deployment environment settings, never in source control or this document.

**Verification performed during the build:** the deployed Insights page displayed the selected merchant context and explicitly labelled synthetic scores; Gemini successfully returned a strategy; and the revised Visuals view displayed a three-step experiment flow, the ₹750 threshold, a 14-day test, test/control framing, success metrics, and guardrails. The strategy shown in the final screenshots matched the selected Electronics / accessories / low-ticket / under-₹1,000 / below-15%-margin context and the average-order-value goal. The Results page should be described as simulated and checked against the prototype's stated assumptions before making any numerical claims.

---

This log describes a prototype and its build process. It does not claim validated merchant outcomes or production readiness.
