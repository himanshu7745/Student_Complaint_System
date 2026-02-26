import io
from typing import List, Sequence, Union

import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from transformers import CLIPModel, CLIPProcessor


ImageInput = Union[Image.Image, torch.Tensor]


class CLIPSeverityClassifier(nn.Module):
    """
    Multimodal model built on top of CLIP that supports:

    1) Severity regression (score from 1 to 10) using:
       - average-pooled image embedding from a list of images
       - single text embedding
       - concatenation + MLP

    2) 10-class classification using cosine similarity:
       - fused (image embedding + text embedding) projected by MLP to CLIP embedding size
       - class text embeddings generated from a list of 10 class strings
       - cosine similarity between fused query and class embeddings
    """

    def __init__(
        self,
        model_name: str = "openai/clip-vit-base-patch32",
        device: str | None = None,
        freeze_clip: bool = True,
        hidden_dim: int = 512,
        dropout: float = 0.1,
    ) -> None:
        super().__init__()

        self.device = torch.device(device if device is not None else ("cuda" if torch.cuda.is_available() else "cpu"))
        self.clip = CLIPModel.from_pretrained(model_name)
        self.processor = CLIPProcessor.from_pretrained(model_name)

        if freeze_clip:
            for param in self.clip.parameters():
                param.requires_grad = False

        self.clip.to(self.device)

        embed_dim = self.clip.config.projection_dim
        self.embed_dim = embed_dim

        # Input is concat([image_embed, text_embed]) => 2 * embed_dim
        self.severity_mlp = nn.Sequential(
            nn.Linear(2 * embed_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, 1),
        )

        # Output must match CLIP embedding dimension for cosine classification
        self.fusion_mlp = nn.Sequential(
            nn.Linear(2 * embed_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, embed_dim),
        )

        self.to(self.device)

    def _prepare_image_inputs(self, images: Sequence[ImageInput]) -> List[Image.Image]:
        if len(images) == 0:
            raise ValueError("images list must not be empty")

        pil_images: List[Image.Image] = []
        for img in images:
            if isinstance(img, Image.Image):
                pil_images.append(img.convert("RGB"))
            elif isinstance(img, torch.Tensor):
                # Tensor expected in CHW or HWC format, values in [0, 1] or [0, 255]
                tensor_img = img.detach().cpu()
                if tensor_img.ndim == 3 and tensor_img.shape[0] in (1, 3):
                    # CHW -> HWC
                    tensor_img = tensor_img.permute(1, 2, 0)
                if tensor_img.ndim != 3 or tensor_img.shape[-1] not in (1, 3):
                    raise ValueError("Tensor image must be HWC/CHW with 1 or 3 channels")

                tensor_img = tensor_img.float()
                if tensor_img.max() <= 1.0:
                    tensor_img = tensor_img * 255.0
                tensor_img = tensor_img.clamp(0, 255).byte().numpy()

                if tensor_img.shape[-1] == 1:
                    tensor_img = tensor_img.squeeze(-1)
                pil_images.append(Image.fromarray(tensor_img).convert("RGB"))
            else:
                raise TypeError(f"Unsupported image type: {type(img)}")
        return pil_images

    def encode_images(self, images: Sequence[ImageInput], normalize: bool = True) -> torch.Tensor:
        """
        Encodes a list of images and returns average-pooled embedding of shape [1, D].
        """
        pil_images = self._prepare_image_inputs(images)
        inputs = self.processor(images=pil_images, return_tensors="pt", padding=True).to(self.device)

        image_features = self.clip.get_image_features(**inputs)  # [N, D]
        if normalize:
            image_features = F.normalize(image_features, dim=-1)

        pooled = image_features.mean(dim=0, keepdim=True)  # [1, D]
        if normalize:
            pooled = F.normalize(pooled, dim=-1)
        return pooled

    def encode_text(self, text: str, normalize: bool = True) -> torch.Tensor:
        """
        Encodes a single text string and returns embedding of shape [1, D].
        """
        if not isinstance(text, str) or len(text.strip()) == 0:
            raise ValueError("text must be a non-empty string")

        inputs = self.processor(text=[text], return_tensors="pt", padding=True, truncation=True).to(self.device)
        text_features = self.clip.get_text_features(**inputs)  # [1, D]
        if normalize:
            text_features = F.normalize(text_features, dim=-1)
        return text_features

    def encode_class_texts(self, class_texts: Sequence[str], normalize: bool = True) -> torch.Tensor:
        """
        Encodes class prompt strings and returns embeddings of shape [C, D].
        """
        if len(class_texts) == 0:
            raise ValueError("class_texts must not be empty")
        if any((not isinstance(t, str) or len(t.strip()) == 0) for t in class_texts):
            raise ValueError("All class_texts must be non-empty strings")

        inputs = self.processor(text=list(class_texts), return_tensors="pt", padding=True, truncation=True).to(self.device)
        class_features = self.clip.get_text_features(**inputs)  # [C, D]
        if normalize:
            class_features = F.normalize(class_features, dim=-1)
        return class_features

    def _compute_shared_features(self, images: Sequence[ImageInput], text: str) -> dict:
        """
        Computes shared multimodal features once and reuses them across heads.
        """
        image_embed = self.encode_images(images, normalize=True)  # [1, D]
        text_embed = self.encode_text(text, normalize=True)  # [1, D]
        combined = torch.cat([image_embed, text_embed], dim=-1)  # [1, 2D]
        fused = self.fusion_mlp(combined)  # [1, D]
        fused = F.normalize(fused, dim=-1)
        return {
            "image_embed": image_embed,
            "text_embed": text_embed,
            "combined": combined,
            "fused": fused,
        }

    def _severity_from_combined(self, combined: torch.Tensor) -> torch.Tensor:
        """
        Returns severity score in range [1, 10] from combined [1, 2D] feature.
        """
        raw = self.severity_mlp(combined)  # [1, 1]
        return 1.0 + 9.0 * torch.sigmoid(raw)

    def severity_score(self, images: Sequence[ImageInput], text: str) -> torch.Tensor:
        """
        Returns severity score in range [1, 10] with shape [1, 1].
        """
        shared = self._compute_shared_features(images, text)
        return self._severity_from_combined(shared["combined"])

    def classify(
        self,
        images: Sequence[ImageInput],
        text: str,
        class_texts: Sequence[str],
        temperature: float = 1.0,
    ) -> dict:
        """
        Produces cosine-similarity classification over class_texts.

        Returns a dict with:
          - logits: [1, C]
          - probs: [1, C]
          - pred_idx: [1]
          - fused_embedding: [1, D]
          - class_embeddings: [C, D]
        """
        if temperature <= 0:
            raise ValueError("temperature must be > 0")

        shared = self._compute_shared_features(images, text)
        class_embeds = self.encode_class_texts(class_texts, normalize=True)  # [C, D]

        # cosine similarity (normalized dot product)
        logits = (shared["fused"] @ class_embeds.T) / temperature  # [1, C]
        probs = torch.softmax(logits, dim=-1)
        pred_idx = torch.argmax(probs, dim=-1)

        return {
            "logits": logits,
            "probs": probs,
            "pred_idx": pred_idx,
            "fused_embedding": shared["fused"],
            "class_embeddings": class_embeds,
        }

    def forward(
        self,
        images: Sequence[ImageInput],
        text: str,
        class_texts: Sequence[str],
        temperature: float = 1.0,
    ) -> dict:
        """
        Unified forward:
          - severity score from concat(image_pooled, text)
          - cosine classification from fused embedding vs class text embeddings
        """
        if temperature <= 0:
            raise ValueError("temperature must be > 0")

        shared = self._compute_shared_features(images, text)
        severity = self._severity_from_combined(shared["combined"])

        class_embeds = self.encode_class_texts(class_texts, normalize=True)
        logits = (shared["fused"] @ class_embeds.T) / temperature  # [1, C]
        probs = torch.softmax(logits, dim=-1)
        pred_idx = torch.argmax(probs, dim=-1)

        return {
            "severity": severity,
            "logits": logits,
            "probs": probs,
            "pred_idx": pred_idx,
            "fused_embedding": shared["fused"],
            "class_embeddings": class_embeds,
        }


def predict_from_items(
    model: CLIPSeverityClassifier,
    items: Sequence[dict],
    class_texts: Sequence[str],
    temperature: float = 1.0,
) -> list[dict]:
    """
    Utility inference function for payload format:

    items: List[dict] where each dict contains:
      - title: str
      - description: str
      - images: list[io.BytesIO]

    Returns one prediction dict per item with severity and class outputs.
    """
    if len(class_texts) == 0:
        raise ValueError("class_texts must not be empty")

    predictions: list[dict] = []
    model_was_training = model.training
    model.eval()

    try:
        with torch.no_grad():
            for idx, item in enumerate(items):
                if not isinstance(item, dict):
                    raise TypeError(f"items[{idx}] must be a dictionary")

                title = item.get("title")
                description = item.get("description")
                image_streams = item.get("images")

                if not isinstance(title, str) or len(title.strip()) == 0:
                    raise ValueError(f"items[{idx}]['title'] must be a non-empty string")
                if not isinstance(description, str) or len(description.strip()) == 0:
                    raise ValueError(f"items[{idx}]['description'] must be a non-empty string")
                if not isinstance(image_streams, list) or len(image_streams) == 0:
                    raise ValueError(f"items[{idx}]['images'] must be a non-empty list of io.BytesIO")

                pil_images: list[Image.Image] = []
                for img_idx, stream in enumerate(image_streams):
                    if not isinstance(stream, io.BytesIO):
                        raise TypeError(f"items[{idx}]['images'][{img_idx}] must be io.BytesIO")
                    stream.seek(0)
                    pil_images.append(Image.open(stream).convert("RGB"))

                merged_text = f"{title.strip()}\n{description.strip()}"
                output = model(
                    images=pil_images,
                    text=merged_text,
                    class_texts=class_texts,
                    temperature=temperature,
                )

                severity = float(output["severity"].squeeze().detach().cpu().item())
                logits = output["logits"].squeeze(0).detach().cpu().tolist()
                probs = output["probs"].squeeze(0).detach().cpu().tolist()
                pred_idx = int(output["pred_idx"].squeeze().detach().cpu().item())
                pred_label = class_texts[pred_idx]

                predictions.append(
                    {
                        "severity": severity,
                        "pred_idx": pred_idx,
                        "pred_label": pred_label,
                        "logits": logits,
                        "probs": probs,
                    }
                )
    finally:
        if model_was_training:
            model.train()

    return predictions
