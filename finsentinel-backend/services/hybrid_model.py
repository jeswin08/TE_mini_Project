"""Hybrid scoring model utilities for combining multiple risk engines."""

from __future__ import annotations

from abc import ABC, abstractmethod


class BaseHybridScorer(ABC):
    """Interface for pluggable hybrid scorers."""

    @abstractmethod
    def combine(self, ml_score: float, rule_score: float) -> float:
        """Combine heterogeneous model scores into a single risk score."""


class WeightedHybridScorer(BaseHybridScorer):
    """Weighted scorer for blending ML and rule-engine risk scores."""

    def __init__(self, ml_weight: float = 0.8, rule_weight: float = 0.2) -> None:
        self.ml_weight = ml_weight
        self.rule_weight = rule_weight

    def combine(self, ml_score: float, rule_score: float) -> float:
        """Return weighted risk score constrained to [0, 100]."""
        final_score = (self.ml_weight * float(ml_score)) + (self.rule_weight * float(rule_score))
        return round(min(max(final_score, 0.0), 100.0), 2)


def hybrid_score(ml_score: float, rule_score: float) -> float:
    """Compute current production hybrid score using ML and rule-based risk."""
    try:
        scorer = WeightedHybridScorer(ml_weight=0.8, rule_weight=0.2)
        return scorer.combine(ml_score, rule_score)
    except Exception:
        # Preserve pipeline safety using the same default formula.
        fallback = (0.8 * float(ml_score)) + (0.2 * float(rule_score))
        return round(min(max(fallback, 0.0), 100.0), 2)
