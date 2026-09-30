import os
import logging
from typing import Optional
from models import Patient, UrgencyScore, PriorityTier

logger = logging.getLogger("ai_engine")

def generate_local_clinical_briefing(patient: Patient, score: UrgencyScore) -> str:
    """
    Generates a deterministic, structured, provider-facing clinical briefing.
    Uses strictly non-diagnostic and explanatory language based on:
    - NEWS2 physiological score & composite urgency
    - Priority tier & vital signs deviations
    - Chief presentation & symptoms
    - Wait time & contributing factors
    - Missing data alerts
    Does NOT diagnose, prescribe, or recommend medical treatments.
    """
    tier_label = {
        PriorityTier.P1_IMMEDIATE: "P1 Immediate",
        PriorityTier.P2_URGENT: "P2 Urgent",
        PriorityTier.P3_DELAYED: "P3 Delayed",
        PriorityTier.P4_ROUTINE: "P4 Routine"
    }.get(score.tier, score.tier.value)

    # 1. Key Contributing Factor Highlights
    bullet_factors = []
    for factor in score.factors[:4]:
        bullet_factors.append(f"- {factor.detail}")

    if not bullet_factors:
        bullet_factors.append("- Routine triage intake presentation with stable baseline parameters.")

    factors_block = "\n".join(bullet_factors)

    # 2. Reason for Priority (Neutral clinical rationale)
    if score.tier == PriorityTier.P1_IMMEDIATE:
        urgency_reason = (
            "Current available observations indicate acute physiological instability or high-risk "
            "clinical indicators requiring expedited attention relative to other cases in the queue."
        )
        provider_action = "Prompt bedside evaluation and immediate clinical reassessment indicated."
    elif score.tier == PriorityTier.P2_URGENT:
        urgency_reason = (
            "Elevated clinical factors or potential for rapid escalation observed. Case warrants "
            "timely provider assessment to prevent decompensation."
        )
        provider_action = "Prioritize for provider evaluation; monitor vital trends closely."
    elif score.tier == PriorityTier.P3_DELAYED:
        urgency_reason = (
            "Moderate clinical acuity with currently stable vital signs, though ongoing waiting "
            "time and symptom burden warrant regular surveillance."
        )
        provider_action = "Routine provider queue assignment with scheduled repeat vitals."
    else:
        urgency_reason = (
            "Baseline observations are within acceptable reference ranges with low immediate risk "
            "of physiological decompensation."
        )
        provider_action = "Standard waiting room monitoring as service capacity permits."

    # 3. Assemble Structured Briefing
    briefing = (
        f"Priority: {tier_label} (Urgency Score: {score.composite_score}/100, NEWS2: {score.news2_score})\n\n"
        f"Key contributing factors:\n{factors_block}\n\n"
        f"Reason for priority:\n{urgency_reason}\n\n"
        f"Provider action:\n{provider_action}"
    )

    if score.missing_data_alerts:
        briefing += f"\n\nInformation Notice: Missing or pending data noted: {', '.join(score.missing_data_alerts)}."

    return briefing


async def _generate_external_briefing(patient: Patient, score: UrgencyScore, api_key: str) -> Optional[str]:
    """
    Optional external LLM call if CAREQUEUE_AI_MODE=external and API key is present.
    Gracefully returns None on failure/timeout to trigger local fallback.
    """
    try:
        import httpx
        # Example lightweight non-blocking call if OpenAI key is present
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            async with httpx.AsyncClient(timeout=3.5) as client:
                prompt = (
                    "You are a clinical decision-support summarizer. Provide a neutral, strictly non-diagnostic, "
                    "supportive summary for the attending provider. Do NOT diagnose or prescribe treatment.\n"
                    f"Patient: {patient.name}, Age: {patient.age}, Complaint: {patient.chief_complaint}\n"
                    f"NEWS2: {score.news2_score}, Tier: {score.tier.value}, Waiting: {score.wait_time_minutes} mins\n"
                    f"Factors: {', '.join([f.detail for f in score.factors[:4]])}"
                )
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}"},
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 150,
                        "temperature": 0.2
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                    if text:
                        return text
    except Exception as e:
        logger.warning(f"External AI briefing unavailable or timed out ({e}). Falling back to local generation.")
    return None


async def generate_ai_briefing(patient: Patient, score: UrgencyScore) -> str:
    """
    Main entry point for generating clinical briefings.
    Strictly local-first:
    - CAREQUEUE_AI_MODE defaults to 'local'.
    - If set to 'external', attempts API call and automatically falls back to local on any issue.
    - Application never fails due to external API errors.
    """
    ai_mode = os.getenv("CAREQUEUE_AI_MODE", "local").lower().strip()

    if ai_mode == "external":
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("NVIDIA_API_KEY")
        if api_key:
            external_result = await _generate_external_briefing(patient, score, api_key)
            if external_result:
                return external_result

    # Default production & demo path: high-fidelity local deterministic synthesis
    return generate_local_clinical_briefing(patient, score)

