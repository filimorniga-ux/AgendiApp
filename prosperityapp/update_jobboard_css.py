import re

with open('src/pages/Website/components/sections/jobboard.css', 'r') as f:
    css = f.read()

# Add CSS variables to the top
variables = """
.jb-page {
  --jb-bg: #020617;
  --jb-text: #e2e8f0;
  --jb-text-muted: #94a3b8;
  --jb-card-bg: rgba(255, 255, 255, 0.03);
  --jb-card-border: rgba(255, 255, 255, 0.06);
  --jb-card-hover-border: rgba(246, 224, 94, 0.15);
  --jb-accent: #f6e05e;
  --jb-accent-hover: #ffe866;
  --jb-hero-bg: #0f172a;
  --jb-hero-gradient-text: linear-gradient(135deg, #ffffff 30%, #f6e05e 100%);
  --jb-input-bg: rgba(255, 255, 255, 0.05);
  --jb-input-border: rgba(255, 255, 255, 0.08);
  --jb-modal-bg: #0f172a;
  --jb-title: #f1f5f9;
  --jb-tab-bg: rgba(255, 255, 255, 0.02);
  --jb-tab-hover: rgba(255, 255, 255, 0.05);
  --jb-tab-active: rgba(255, 255, 255, 0.1);
  --jb-tab-active-text: #f6e05e;
  --jb-logo-bg: linear-gradient(135deg, #1e293b, #334155);
  --jb-select-bg-img: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  --jb-input-focus-border: rgba(246, 224, 94, 0.4);
  --jb-input-focus-shadow: 0 0 0 3px rgba(246, 224, 94, 0.1);
  --jb-comp-bg: rgba(246, 224, 94, 0.04);
  --jb-comp-border: rgba(246, 224, 94, 0.1);
  --jb-btn-email-bg: rgba(255, 255, 255, 0.06);
  --jb-btn-email-border: rgba(255, 255, 255, 0.1);
  --jb-btn-email-hover: rgba(255, 255, 255, 0.1);
  --jb-tag-sector-bg: rgba(246, 224, 94, 0.1);
  --jb-tag-sector-border: rgba(246, 224, 94, 0.15);
  --jb-tag-sector-text: #f6e05e;
}

.jb-page[data-theme="light"] {
  --jb-bg: #f8fafc;
  --jb-text: #334155;
  --jb-text-muted: #64748b;
  --jb-card-bg: #ffffff;
  --jb-card-border: #e2e8f0;
  --jb-card-hover-border: #cbd5e1;
  --jb-accent: #d97706; 
  --jb-accent-hover: #b45309;
  --jb-hero-bg: #e2e8f0;
  --jb-hero-gradient-text: linear-gradient(135deg, #0f172a 30%, #d97706 100%);
  --jb-input-bg: #ffffff;
  --jb-input-border: #cbd5e1;
  --jb-modal-bg: #ffffff;
  --jb-title: #0f172a;
  --jb-tab-bg: rgba(0, 0, 0, 0.03);
  --jb-tab-hover: rgba(0, 0, 0, 0.06);
  --jb-tab-active: #ffffff;
  --jb-tab-active-text: #d97706;
  --jb-logo-bg: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  --jb-select-bg-img: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  --jb-input-focus-border: rgba(217, 119, 6, 0.4);
  --jb-input-focus-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
  --jb-comp-bg: #fffbeb;
  --jb-comp-border: #fde68a;
  --jb-btn-email-bg: #f1f5f9;
  --jb-btn-email-border: #e2e8f0;
  --jb-btn-email-hover: #e2e8f0;
  --jb-tag-sector-bg: #fef3c7;
  --jb-tag-sector-border: #fde68a;
  --jb-tag-sector-text: #d97706;
}

"""

# Base replacement rules
replacements = [
    (r"background: #020617;", r"background: var(--jb-bg);"),
    (r"color: #e2e8f0;", r"color: var(--jb-text);"),
    (r"linear-gradient\(to bottom, #0f172a, #020617\)", r"linear-gradient(to bottom, var(--jb-hero-bg), var(--jb-bg))"),
    (r"background: linear-gradient\(135deg, #ffffff 30%, #f6e05e 100%\);", r"background: var(--jb-hero-gradient-text);"),
    (r"color: #94a3b8;", r"color: var(--jb-text-muted);"),
    (r"background: rgba\(255, 255, 255, 0.02\);", r"background: var(--jb-tab-bg);"),
    (r"border: 1px solid rgba\(255, 255, 255, 0.05\);", r"border: 1px solid var(--jb-card-border);"),
    (r"color: #f1f5f9;", r"color: var(--jb-title);"),
    (r"background: rgba\(255, 255, 255, 0.05\);", r"background: var(--jb-input-bg);"),
    (r"background: rgba\(255, 255, 255, 0.1\);", r"background: var(--jb-tab-active);"),
    (r"color: #f6e05e;", r"color: var(--jb-accent);"),
    (r"background: rgba\(255, 255, 255, 0.03\);", r"background: var(--jb-card-bg);"),
    (r"border: 1px solid rgba\(255, 255, 255, 0.06\);", r"border: 1px solid var(--jb-card-border);"),
    (r"border: 1px solid rgba\(255, 255, 255, 0.08\);", r"border: 1px solid var(--jb-input-border);"),
    (r"border-color: rgba\(246, 224, 94, 0.4\);", r"border-color: var(--jb-input-focus-border);"),
    (r"box-shadow: 0 0 0 3px rgba\(246, 224, 94, 0.1\);", r"box-shadow: var(--jb-input-focus-shadow);"),
    (r"background-image: url\([^)]+\);", r"background-image: var(--jb-select-bg-img);"),
    (r"background: #1e293b;", r"background: var(--jb-bg);"),
    (r"background: linear-gradient\(135deg, #1e293b, #334155\);", r"background: var(--jb-logo-bg);"),
    (r"background: rgba\(246, 224, 94, 0.1\);", r"background: var(--jb-tag-sector-bg);"),
    (r"border: 1px solid rgba\(246, 224, 94, 0.15\);", r"border: 1px solid var(--jb-tag-sector-border);"),
    (r"color: #cbd5e1;", r"color: var(--jb-text);"),
    (r"background: #0f172a;", r"background: var(--jb-modal-bg);"),
    (r"border-top: 1px solid rgba\(255, 255, 255, 0.05\);", r"border-top: 1px solid var(--jb-card-border);"),
    (r"background: rgba\(246, 224, 94, 0.04\);", r"background: var(--jb-comp-bg);"),
    (r"border: 1px solid rgba\(246, 224, 94, 0.1\);", r"border: 1px solid var(--jb-comp-border);"),
    (r"background: rgba\(255, 255, 255, 0.06\);", r"background: var(--jb-btn-email-bg);"),
    (r"border: 1px solid rgba\(255, 255, 255, 0.1\);", r"border: 1px solid var(--jb-btn-email-border);"),
    (r"background: rgba\(255, 255, 255, 0.1\);", r"background: var(--jb-btn-email-hover);"),
    (r"border-color: rgba\(246, 224, 94, 0.15\);", r"border-color: var(--jb-card-hover-border);"),
]

for old, new in replacements:
    css = re.sub(old, new, css)

# add the forms classes
css += """

/* ── Form Inputs ───────────────────────────────────────────────────────────── */
.jb-form-input, .jb-form-select, .jb-form-textarea {
  width: 100%;
  padding: 12px 14px;
  background: var(--jb-input-bg);
  border: 1px solid var(--jb-input-border);
  border-radius: 12px;
  color: var(--jb-text);
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.jb-form-input:focus, .jb-form-select:focus, .jb-form-textarea:focus {
  border-color: var(--jb-input-focus-border);
  box-shadow: var(--jb-input-focus-shadow);
  background: var(--jb-bg);
}

.jb-form-select {
  appearance: none;
  background-image: var(--jb-select-bg-img);
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}
"""

with open('src/pages/Website/components/sections/jobboard.css', 'w') as f:
    f.write(variables + css)
