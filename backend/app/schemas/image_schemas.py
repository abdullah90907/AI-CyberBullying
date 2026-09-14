from pydantic import BaseModel, ConfigDict


class FileInfo(BaseModel):
    status: str
    file_name: str
    extracted_text: str


class AnalysisBreakdown(BaseModel):
    text_toxicity_score: float
    vision_toxicity_score: float
    local_combined_score: float
    manipulation_score: float = 0.0      # NEW -- CLIP label 5 (deepfake/AI-manipulated)
    self_harm_score: float = 0.0         # NEW -- CLIP label 6 (self-harm content)


class FinalVerdict(BaseModel):
    result_label: str
    final_score: float
    reasoning: str
    violated_categories: list[str] = []          # NEW -- Task 3: YouthSafe taxonomy category IDs
    is_likely_manipulated: bool = False           # NEW -- Task 5: True if manipulation_score > 0.5 or O9 flagged


class ImageDetectionResponse(BaseModel):
    file_info: FileInfo
    analysis_breakdown: AnalysisBreakdown
    final_verdict: FinalVerdict

    model_config = ConfigDict(from_attributes=True)
