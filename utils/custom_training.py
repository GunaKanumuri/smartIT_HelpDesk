"""
utils/custom_training.py

Lets a workspace train the classifier on its OWN historical messages
instead of the generic preset profiles. This is the difference between
"a demo classifier" and something honest to tell a real customer:
"it's trained on your actual messages."

Files land under:
    data/custom/<workspace_slug>.csv           (the uploaded training data)
    model/custom/<workspace_slug>/ticket_classifier.pkl
    model/custom/<workspace_slug>/metrics.json
"""

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

ROOT = Path(__file__).resolve().parent.parent
CUSTOM_DATA_DIR = ROOT / "data" / "custom"
CUSTOM_MODEL_DIR = ROOT / "model" / "custom"

MIN_CATEGORIES = 2
MIN_EXAMPLES_PER_CATEGORY = 5
REQUIRED_COLUMNS = {"text", "category"}


def validate_training_data(df: pd.DataFrame) -> tuple[bool, str]:
    """
    Check that uploaded data is actually trainable before wasting anyone's
    time. Returns (is_valid, message) — message explains what's wrong,
    or is a short summary if valid.
    """
    cols = {c.strip().lower() for c in df.columns}
    if not REQUIRED_COLUMNS.issubset(cols):
        return False, (
            f"CSV must have columns named exactly 'text' and 'category'. "
            f"Found: {', '.join(df.columns)}"
        )

    df = df.rename(columns={c: c.strip().lower() for c in df.columns})
    df = df.dropna(subset=["text", "category"])
    df["text"] = df["text"].astype(str).str.strip()
    df["category"] = df["category"].astype(str).str.strip()
    df = df[(df["text"] != "") & (df["category"] != "")]

    if df.empty:
        return False, "No valid rows found after removing empty text/category cells."

    counts = df["category"].value_counts()
    n_categories = len(counts)

    if n_categories < MIN_CATEGORIES:
        return False, (
            f"Found only {n_categories} category. Need at least {MIN_CATEGORIES} "
            f"different categories for the model to learn to distinguish between them."
        )

    too_few = counts[counts < MIN_EXAMPLES_PER_CATEGORY]
    if not too_few.empty:
        details = ", ".join(f"{cat} ({n})" for cat, n in too_few.items())
        return False, (
            f"These categories have fewer than {MIN_EXAMPLES_PER_CATEGORY} examples: "
            f"{details}. Add more examples for each, or merge them into a bigger category."
        )

    summary = ", ".join(f"{cat}: {n}" for cat, n in counts.items())
    return True, f"{len(df)} usable rows across {n_categories} categories — {summary}"


def train_custom_model(workspace_slug: str, df: pd.DataFrame) -> dict:
    """
    Train and save a workspace-specific model. Assumes validate_training_data
    already passed. Returns the metrics dict that also gets saved to disk.
    """
    df = df.rename(columns={c: c.strip().lower() for c in df.columns})
    df = df.dropna(subset=["text", "category"])
    df["text"] = df["text"].astype(str).str.strip()
    df["category"] = df["category"].astype(str).str.strip()
    df = df[(df["text"] != "") & (df["category"] != "")]

    # Save the raw training data for the record / future retraining
    CUSTOM_DATA_DIR.mkdir(parents=True, exist_ok=True)
    df[["text", "category"]].to_csv(CUSTOM_DATA_DIR / f"{workspace_slug}.csv", index=False)

    counts = df["category"].value_counts()
    # With very small classes, a stratified test split can fail — fall back
    # to evaluating on the training data itself and say so honestly in the
    # metrics, rather than crashing on a real customer's small starter dataset.
    can_split = (counts >= 2).all() and len(df) >= 10
    if can_split:
        X_train, X_test, y_train, y_test = train_test_split(
            df["text"], df["category"], test_size=0.2, random_state=42, stratify=df["category"],
        )
        eval_note = "held-out 20% test split"
    else:
        X_train, y_train = df["text"], df["category"]
        X_test, y_test = df["text"], df["category"]
        eval_note = "training data itself (too little data for a held-out split — treat this accuracy as optimistic)"

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words="english")),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    # Refit on all available data before saving
    pipeline.fit(df["text"], df["category"])

    model_dir = CUSTOM_MODEL_DIR / workspace_slug
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, model_dir / "ticket_classifier.pkl")

    metrics = {
        "workspace_slug": workspace_slug,
        "test_accuracy": accuracy,
        "evaluation_method": eval_note,
        "classification_report": report,
        "n_samples": len(df),
        "categories": sorted(df["category"].unique().tolist()),
    }
    (model_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))

    return metrics


def has_custom_model(workspace_slug: str) -> bool:
    return (CUSTOM_MODEL_DIR / workspace_slug / "ticket_classifier.pkl").exists()


def load_custom_model(workspace_slug: str):
    model_path = CUSTOM_MODEL_DIR / workspace_slug / "ticket_classifier.pkl"
    if not model_path.exists():
        raise FileNotFoundError(f"No custom model trained yet for '{workspace_slug}'.")
    return joblib.load(model_path)


def get_custom_metrics(workspace_slug: str) -> dict | None:
    metrics_path = CUSTOM_MODEL_DIR / workspace_slug / "metrics.json"
    if not metrics_path.exists():
        return None
    return json.loads(metrics_path.read_text())
