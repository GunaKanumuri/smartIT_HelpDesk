"""
model/train_model.py

Trains one classifier per business profile. Each profile has its own
training CSV in data/profiles/<profile>.csv and its own category set —
this is what makes the engine business-agnostic rather than hardcoded
to IT tickets.

Run from the project root:
    python model/train_model.py            # trains all profiles
    python model/train_model.py it_support  # trains just one profile
"""

import json
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils.profiles import PROFILES  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "profiles"
MODEL_DIR = ROOT / "model" / "profiles"


def train_profile(profile_id: str):
    data_path = DATA_DIR / f"{profile_id}.csv"
    if not data_path.exists():
        raise FileNotFoundError(f"No training data at {data_path}")

    df = pd.read_csv(data_path).dropna(subset=["ticket_text", "category"])

    X_train, X_test, y_train, y_test = train_test_split(
        df["ticket_text"], df["category"],
        test_size=0.2, random_state=42, stratify=df["category"],
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words="english")),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    print(f"\n=== {profile_id} ===")
    print(f"Test accuracy: {accuracy:.2%}")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Refit on the full dataset before saving
    pipeline.fit(df["ticket_text"], df["category"])

    profile_dir = MODEL_DIR / profile_id
    profile_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, profile_dir / "ticket_classifier.pkl")

    (profile_dir / "metrics.json").write_text(json.dumps({
        "profile": profile_id,
        "display_name": PROFILES.get(profile_id, profile_id),
        "test_accuracy": accuracy,
        "classification_report": report,
        "n_samples": len(df),
        "categories": sorted(df["category"].unique().tolist()),
    }, indent=2))

    print(f"Model saved to {profile_dir / 'ticket_classifier.pkl'}")


def train_all():
    for profile_id in PROFILES:
        train_profile(profile_id)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        train_profile(sys.argv[1])
    else:
        train_all()
