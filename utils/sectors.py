# =============================================================================
# utils/sectors.py
#
# Central sector registry for TriageIQ. Every workspace picks a sector at
# signup, and this module determines:
#   - Whether an incoming message is relevant to that business type
#   - What to say if it isn't (with appropriate emergency redirects)
#   - What default categories to use if no custom model is trained
#
# TABLE OF CONTENTS
# -----------------
# 1. SECTOR_REGISTRY      — Full registry of all 13 supported sectors
# 2. CROSS-SECTOR ALERTS  — Emergency keywords that override sector filtering
# 3. HELPER FUNCTIONS     — Lookups, validation, sector list for UI
# =============================================================================

"""
utils/sectors.py

Central sector registry for TriageIQ. Maps each business sector to:
  - Display name and description
  - Relevant domain keywords (what messages *should* be about)
  - Off-topic redirect text (what to say if a message doesn't belong)
  - Default categories for that sector's classifier
  - Emergency detection keywords

Adding a new sector is one dict entry here — no code changes anywhere else.
"""

# =============================================================================
# region 1. SECTOR REGISTRY
# =============================================================================

SECTORS = {
    "bakery": {
        "name": "Bakery & Confectionery",
        "description": "Bakeries, cake shops, confectioneries, catering",
        "keywords": [
            "cake", "bread", "pastry", "cookie", "cupcake", "order", "delivery",
            "pickup", "custom", "wedding", "birthday", "catering", "allergy",
            "ingredient", "gluten", "frosting", "icing", "donut", "muffin",
            "croissant", "pie", "dessert", "flavor", "taste", "stale", "fresh",
            "price", "menu", "special", "bulk", "wholesale",
        ],
        "default_categories": [
            "Orders & Delivery", "Product Quality", "Custom Requests",
            "Pricing & Billing", "Allergies & Ingredients",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For bakery-related concerns — orders, products, delivery, "
            "custom requests — please describe your issue."
        ),
        "emergency_redirect": "If you have a medical emergency, please call 911.",
    },

    "plumbing": {
        "name": "Plumbing & Home Services",
        "description": "Plumbers, HVAC, home repair, maintenance",
        "keywords": [
            "leak", "pipe", "water", "drain", "faucet", "toilet", "repair",
            "appointment", "quote", "estimate", "clog", "sewer", "heater",
            "boiler", "valve", "pressure", "flood", "burst", "fixture",
            "installation", "maintenance", "emergency", "plumber", "bathroom",
            "kitchen", "basement", "hot water", "cold water", "bill",
        ],
        "default_categories": [
            "Emergency Repairs", "Appointments & Scheduling",
            "Quotes & Estimates", "Billing & Payments", "Maintenance",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For plumbing or home service concerns — repairs, appointments, "
            "quotes — please describe your issue."
        ),
        "emergency_redirect": "If you have a medical emergency, please call 911. For gas leaks, call your gas company or 911.",
    },

    "restaurant": {
        "name": "Restaurant & Food Service",
        "description": "Restaurants, cafes, bars, food trucks, catering",
        "keywords": [
            "order", "food", "delivery", "reservation", "table", "menu",
            "meal", "dish", "waiter", "service", "bill", "tip", "taste",
            "cold", "wrong order", "allergy", "vegetarian", "vegan", "spicy",
            "drink", "takeout", "pickup", "catering", "party", "event",
            "hours", "open", "closed", "wait", "clean", "hygiene",
        ],
        "default_categories": [
            "Orders & Delivery", "Reservations", "Food Quality",
            "Service Complaints", "Billing & Payments",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For restaurant-related concerns — orders, reservations, food "
            "quality — please describe your issue."
        ),
        "emergency_redirect": "If you have a medical emergency or allergic reaction, please call 911.",
    },

    "ecommerce": {
        "name": "E-Commerce & Online Retail",
        "description": "Online stores, marketplaces, dropshipping, retail",
        "keywords": [
            "order", "shipping", "delivery", "tracking", "refund", "return",
            "exchange", "payment", "charge", "bill", "product", "item",
            "wrong", "damaged", "missing", "late", "cancel", "subscription",
            "account", "login", "password", "cart", "checkout", "coupon",
            "discount", "warranty", "size", "color", "stock", "available",
        ],
        "default_categories": [
            "Shipping & Delivery", "Refund & Returns", "Billing",
            "Product Issue", "Sales Inquiry",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For order, shipping, or product concerns, please describe "
            "your issue."
        ),
        "emergency_redirect": "If you have a medical emergency, please call 911.",
    },

    "legal": {
        "name": "Legal Services",
        "description": "Law firms, attorneys, legal consulting, notary",
        "keywords": [
            "case", "lawyer", "attorney", "court", "legal", "contract",
            "document", "filing", "consultation", "appointment", "fee",
            "retainer", "settlement", "lawsuit", "claim", "dispute",
            "divorce", "custody", "estate", "will", "trust", "patent",
            "trademark", "immigration", "visa", "defense", "prosecution",
            "bail", "hearing", "trial", "appeal",
        ],
        "default_categories": [
            "Consultation Requests", "Case Status", "Billing & Fees",
            "Document Requests", "Appointments",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For legal service inquiries — consultations, case status, "
            "documents — please describe your concern."
        ),
        "emergency_redirect": "If you're in immediate danger, please call 911.",
    },

    "medical": {
        "name": "Medical & Healthcare",
        "description": "Clinics, hospitals, dental, therapy, healthcare",
        "keywords": [
            "appointment", "doctor", "nurse", "prescription", "medication",
            "pain", "symptom", "diagnosis", "treatment", "surgery", "lab",
            "test", "result", "insurance", "billing", "copay", "referral",
            "specialist", "emergency", "urgent", "followup", "checkup",
            "vaccine", "dental", "therapy", "mental health", "records",
            "patient", "health", "clinic", "hospital",
        ],
        "default_categories": [
            "Appointments & Scheduling", "Prescriptions & Medication",
            "Billing & Insurance", "Test Results", "General Inquiries",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For medical concerns — appointments, prescriptions, billing "
            "— please describe your issue."
        ),
        "emergency_redirect": "If you're experiencing a medical emergency, please call 911 or go to your nearest emergency room immediately.",
    },

    "saas": {
        "name": "SaaS & Software",
        "description": "Software companies, apps, cloud services, tech products",
        "keywords": [
            "bug", "error", "crash", "login", "password", "account",
            "feature", "update", "upgrade", "downgrade", "subscription",
            "billing", "plan", "pricing", "integration", "api", "data",
            "export", "import", "permission", "access", "admin", "user",
            "performance", "slow", "outage", "down", "support", "help",
            "documentation", "setup", "install", "configure",
        ],
        "default_categories": [
            "Bug Reports", "Account & Access", "Billing & Subscriptions",
            "Feature Requests", "Setup & Configuration",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For software-related issues — bugs, account access, billing "
            "— please describe your issue."
        ),
        "emergency_redirect": "If you have a medical emergency, please call 911.",
    },

    "real_estate": {
        "name": "Real Estate",
        "description": "Real estate agencies, property management, rentals",
        "keywords": [
            "property", "house", "apartment", "rent", "lease", "buy",
            "sell", "mortgage", "listing", "viewing", "tour", "agent",
            "broker", "closing", "inspection", "appraisal", "maintenance",
            "repair", "tenant", "landlord", "deposit", "eviction",
            "contract", "offer", "counter", "negotiation", "move",
            "neighborhood", "location", "price",
        ],
        "default_categories": [
            "Property Inquiries", "Maintenance & Repairs",
            "Lease & Payments", "Viewings & Tours", "General Questions",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For real estate concerns — properties, rentals, maintenance "
            "— please describe your issue."
        ),
        "emergency_redirect": "If you have a medical emergency, please call 911. For property emergencies (gas leak, flooding), contact your local emergency services.",
    },

    "automotive": {
        "name": "Automotive & Auto Repair",
        "description": "Auto repair, car dealerships, detailing, tire shops",
        "keywords": [
            "car", "vehicle", "repair", "service", "oil", "brake", "tire",
            "engine", "transmission", "battery", "inspection", "appointment",
            "estimate", "quote", "warranty", "recall", "accident", "body",
            "paint", "detail", "wash", "tune", "diagnostic", "check",
            "mileage", "fuel", "lease", "purchase", "trade",
        ],
        "default_categories": [
            "Service & Repairs", "Appointments", "Quotes & Estimates",
            "Billing & Payments", "Vehicle Inquiries",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For automotive concerns — repairs, appointments, estimates "
            "— please describe your issue."
        ),
        "emergency_redirect": "If you have a medical emergency or are in a traffic accident, please call 911.",
    },

    "salon": {
        "name": "Salon & Beauty",
        "description": "Hair salons, spas, beauty parlors, barbershops, nail studios",
        "keywords": [
            "appointment", "booking", "haircut", "color", "style", "trim",
            "blowout", "treatment", "facial", "massage", "nail", "manicure",
            "pedicure", "wax", "spa", "beauty", "product", "shampoo",
            "conditioner", "cancel", "reschedule", "stylist", "barber",
            "price", "package", "membership", "gift", "bridal",
        ],
        "default_categories": [
            "Appointments & Booking", "Service Complaints",
            "Pricing & Packages", "Product Inquiries", "General Questions",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For salon-related concerns — appointments, services, products "
            "— please describe your issue."
        ),
        "emergency_redirect": "If you have a medical emergency or allergic reaction, please call 911.",
    },

    "fitness": {
        "name": "Fitness & Gym",
        "description": "Gyms, fitness centers, yoga studios, personal training",
        "keywords": [
            "membership", "class", "schedule", "trainer", "session",
            "workout", "gym", "equipment", "locker", "pool", "yoga",
            "pilates", "cancel", "freeze", "billing", "fee", "tour",
            "trial", "guest", "hours", "parking", "clean", "maintenance",
            "injury", "personal training", "group", "nutrition",
        ],
        "default_categories": [
            "Membership & Billing", "Classes & Scheduling",
            "Facility Issues", "Personal Training", "General Questions",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For fitness-related concerns — memberships, classes, facilities "
            "— please describe your issue."
        ),
        "emergency_redirect": "If you have a medical emergency, please call 911.",
    },

    "education": {
        "name": "Education & Tutoring",
        "description": "Schools, tutoring centers, online courses, coaching",
        "keywords": [
            "class", "course", "enrollment", "registration", "schedule",
            "tutor", "teacher", "instructor", "grade", "exam", "test",
            "homework", "assignment", "certificate", "diploma", "fee",
            "tuition", "scholarship", "financial aid", "student", "parent",
            "curriculum", "syllabus", "material", "online", "session",
            "progress", "report", "attendance",
        ],
        "default_categories": [
            "Enrollment & Registration", "Course Inquiries",
            "Billing & Tuition", "Academic Support", "General Questions",
        ],
        "irrelevant_response": (
            "This doesn't appear to be related to {business_name}. "
            "For education-related concerns — courses, enrollment, billing "
            "— please describe your issue."
        ),
        "emergency_redirect": "If you have a medical emergency, please call 911.",
    },

    "other": {
        "name": "Other / General Business",
        "description": "Catch-all for business types not listed above",
        "keywords": [],  # Empty — no sector filtering, relies purely on ML
        "default_categories": [
            "General Inquiry", "Billing & Payments", "Service Issue",
            "Complaints", "Other",
        ],
        "irrelevant_response": None,  # No sector filter for catch-all
        "emergency_redirect": "If you have an emergency, please call 911.",
    },
}

# endregion

# =============================================================================
# region 2. CROSS-SECTOR EMERGENCY KEYWORDS
# =============================================================================

# These are checked REGARDLESS of sector — if a message contains these,
# the emergency redirect is always shown alongside the normal response.
EMERGENCY_KEYWORDS = [
    "suicide", "suicidal", "kill myself", "end my life", "self harm",
    "heart attack", "chest pain", "can't breathe", "choking",
    "overdose", "poisoned", "bleeding out", "dying",
    "someone is hurt", "call 911", "fire", "shooting",
]

# endregion

# =============================================================================
# region 3. HELPER FUNCTIONS
# =============================================================================


def get_sector(sector_id: str) -> dict | None:
    """Return the full sector dict, or None if not found."""
    return SECTORS.get(sector_id)


def get_sector_name(sector_id: str) -> str:
    """Return the display name for a sector ID."""
    sector = SECTORS.get(sector_id)
    return sector["name"] if sector else sector_id


def get_sector_choices() -> dict[str, str]:
    """Return {sector_id: display_name} for UI dropdowns."""
    return {sid: s["name"] for sid, s in SECTORS.items()}


def get_sector_keywords(sector_id: str) -> list[str]:
    """Return the keyword list for a sector."""
    sector = SECTORS.get(sector_id)
    return sector["keywords"] if sector else []


def get_default_categories(sector_id: str) -> list[str]:
    """Return default ticket categories for a sector."""
    sector = SECTORS.get(sector_id)
    return sector["default_categories"] if sector else []


def is_valid_sector(sector_id: str) -> bool:
    """Check if a sector ID exists in the registry."""
    return sector_id in SECTORS


def has_emergency_keywords(text: str) -> bool:
    """Check if text contains cross-sector emergency keywords."""
    lowered = text.lower()
    return any(kw in lowered for kw in EMERGENCY_KEYWORDS)


# endregion
