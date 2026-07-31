"""
model/train_model.py

Improved training script for profile-specific ticket classifiers.

Features:
- TF-IDF or SentenceTransformer embeddings (optional)
- Class-weighted LogisticRegression with simple hyperparameter search
- Probability calibration via CalibratedClassifierCV
- Per-profile artifacts saved separately:
    - vectorizer or embedder
    - calibrated classifier
    - metrics.json (accuracy, classification report, confusion matrix, classes, n_samples, timestamp)
- Refit on full dataset before saving
- CLI:
    python model/train_model.py            # trains all profiles (TF-IDF)
    python model/train_model.py it_support # trains just one profile (TF-IDF)
    python model/train_model.py it_support --embeddings  # trains using sentence-transformer embeddings
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix)
from sklearn.model_selection import GridSearchCV, train_test_split

# allow importing project modules when running from project root
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
try:
    from backend.domain.profiles import PROFILES  # noqa: E402
except Exception:
    # Fallback if running outside full project context
    PROFILES = {}

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "storage" / "datasets" / "profiles"
MODEL_DIR = ROOT / "storage" / "models" / "profiles"


def _safe_read_csv(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    # ensure required columns
    if "ticket_text" not in df.columns or "category" not in df.columns:
        raise ValueError(f"Training CSV {path} must contain 'ticket_text' and 'category' columns")
    df = df.dropna(subset=["ticket_text", "category"]).reset_index(drop=True)
    return df


def _train_tfidf_logreg(X_text, y, profile_dir: Path):
    """
    Train TF-IDF + LogisticRegression with GridSearch and calibration.
    Returns: fitted_vectorizer, fitted_calibrated_clf, metrics (dict)
    """
    # Vectorize
    tfidf = TfidfVectorizer(ngram_range=(1, 2), min_df=2, stop_words="english")
    X = tfidf.fit_transform(X_text)

    # Train/validation split for evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Base classifier with class balancing
    base_clf = LogisticRegression(max_iter=2000, class_weight="balanced", solver="liblinear")

    # Simple grid search for regularization strength
    grid = GridSearchCV(base_clf, {"C": [0.01, 0.1, 1, 10]}, cv=3, scoring="f1_macro", n_jobs=-1)
    grid.fit(X_train, y_train)

    best = grid.best_estimator_

    # Calibrate probabilities (uses cross-validation on training set)
    calibrated = CalibratedClassifierCV(best, cv=3)
    calibrated.fit(X_train, y_train)

    # Evaluate on test set
    y_pred = calibrated.predict(X_test)
    y_proba = calibrated.predict_proba(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_test, y_pred, labels=calibrated.classes_)

    metrics = {
        "test_accuracy": float(accuracy),
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
        "classes": calibrated.classes_.tolist(),
        "best_params": grid.best_params_,
    }

    # Refit on full dataset before saving: fit base classifier on full X, then calibrate on full X
    final_base = LogisticRegression(max_iter=2000, class_weight="balanced", solver="liblinear", **grid.best_params_)
    final_base.fit(X, y)
    final_calibrated = CalibratedClassifierCV(final_base, cv="prefit")
    # calibrate on the same full data (not ideal but acceptable for production-ready artifact)
    final_calibrated.fit(X, y)

    # Persist a single Pipeline that bundles vectorizer + classifier together
    from sklearn.pipeline import Pipeline
    pipeline = Pipeline([
        ("tfidf", tfidf),
        ("clf", final_calibrated),
    ])
    joblib.dump(pipeline, profile_dir / "ticket_classifier.pkl")

    return metrics


def _train_embeddings_logreg(X_text, y, profile_dir: Path, model_name: str = "all-MiniLM-L6-v2"):
    """
    Train SentenceTransformer embeddings + LogisticRegression with GridSearch and calibration.
    Returns: fitted_embedder (joblib-saved), fitted_calibrated_clf, metrics (dict)
    """
    try:
        from sentence_transformers import SentenceTransformer
    except Exception as e:
        raise RuntimeError("sentence-transformers is not installed. Install with `pip install sentence-transformers`") from e

    embedder = SentenceTransformer(model_name)
    X_emb = embedder.encode(X_text.tolist(), show_progress_bar=True, convert_to_numpy=True)

    # Train/validation split
    X_train, X_test, y_train, y_test = train_test_split(
        X_emb, y, test_size=0.2, random_state=42, stratify=y
    )

    base_clf = LogisticRegression(max_iter=2000, class_weight="balanced", solver="liblinear")
    grid = GridSearchCV(base_clf, {"C": [0.01, 0.1, 1, 10]}, cv=3, scoring="f1_macro", n_jobs=-1)
    grid.fit(X_train, y_train)

    best = grid.best_estimator_
    calibrated = CalibratedClassifierCV(best, cv=3)
    calibrated.fit(X_train, y_train)

    y_pred = calibrated.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_test, y_pred, labels=calibrated.classes_)

    metrics = {
        "test_accuracy": float(accuracy),
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
        "classes": calibrated.classes_.tolist(),
        "best_params": grid.best_params_,
        "embedder_model": model_name,
    }

    # Refit on full dataset
    final_base = LogisticRegression(max_iter=2000, class_weight="balanced", solver="liblinear", **grid.best_params_)
    final_base.fit(X_emb, y)
    final_calibrated = CalibratedClassifierCV(final_base, cv="prefit")
    final_calibrated.fit(X_emb, y)

    # Persist a single Pipeline that bundles embedder + classifier together
    from sklearn.pipeline import Pipeline
    pipeline = Pipeline([
        ("embedder", embedder),
        ("clf", final_calibrated),
    ])
    joblib.dump(pipeline, profile_dir / "ticket_classifier.pkl")

    return metrics


def train_profile(profile_id: str, use_embeddings: bool = False, embedder_model: str = "all-MiniLM-L6-v2"):
    data_path = DATA_DIR / f"{profile_id}.csv"
    if not data_path.exists():
        raise FileNotFoundError(f"No training data at {data_path}")

    df = _safe_read_csv(data_path)
    n_samples = len(df)
    if n_samples < 10:
        raise ValueError(f"Not enough samples to train profile {profile_id} (found {n_samples})")

    profile_dir = MODEL_DIR / profile_id
    profile_dir.mkdir(parents=True, exist_ok=True)

    X_text = df["ticket_text"]
    y = df["category"]

    print(f"\nTraining profile '{profile_id}' (samples={n_samples}) using {'embeddings' if use_embeddings else 'tfidf'}")

    if use_embeddings:
        metrics = _train_embeddings_logreg(X_text, y, profile_dir, model_name=embedder_model)
    else:
        metrics = _train_tfidf_logreg(X_text, y, profile_dir)

    # Add metadata and save metrics.json
    metadata = {
        "profile": profile_id,
        "display_name": PROFILES.get(profile_id, profile_id),
        "n_samples": n_samples,
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "training_method": "embeddings" if use_embeddings else "tfidf",
    }
    metadata.update(metrics)

    (profile_dir / "metrics.json").write_text(json.dumps(metadata, indent=2))
    print(f"Saved model and metrics to {profile_dir}")


def train_all(use_embeddings: bool = False, embedder_model: str = "all-MiniLM-L6-v2"):
    if not PROFILES:
        # If PROFILES not available, train on all CSVs found in DATA_DIR
        csvs = list(DATA_DIR.glob("*.csv"))
        profile_ids = [p.stem for p in csvs]
    else:
        profile_ids = list(PROFILES.keys())

    for pid in profile_ids:
        try:
            train_profile(pid, use_embeddings=use_embeddings, embedder_model=embedder_model)
        except Exception as e:
            print(f"Failed to train profile {pid}: {e}")


def parse_args():
    parser = argparse.ArgumentParser(description="Train ticket classifiers per profile")
    parser.add_argument("profile", nargs="?", help="Profile id to train (omit to train all)")
    parser.add_argument("--embeddings", action="store_true", help="Use sentence-transformer embeddings instead of TF-IDF")
    parser.add_argument("--embedder-model", default="all-MiniLM-L6-v2", help="SentenceTransformer model name (when --embeddings is used)")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.profile:
        train_profile(args.profile, use_embeddings=args.embeddings, embedder_model=args.embedder_model)
    else:
        train_all(use_embeddings=args.embeddings, embedder_model=args.embedder_model)
