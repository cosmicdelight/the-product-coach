/*
  # Add new section types for problem-scoping wizard

  ## Summary
  Adds two new values to the `section_type` enum to support the refocused
  6-step proposal wizard. The wizard now ends at problem scoping (no solutioning).

  ## New Enum Values
  - `opportunity_framing` — captures HMW statement, root causes, opportunity scope,
    and design constraints
  - `success_definition` — captures desired outcomes, definition of done, early
    signals, and explicit out-of-scope items

  ## Notes
  - Existing enum values are unchanged; the six removed step types
    (solution_ideation, solution_selection, technical_requirements,
    resource_planning, success_metrics, risk_assessment) remain in the enum
    to avoid disrupting any existing rows — they are simply no longer surfaced
    in the UI.
  - No data is deleted or modified.
*/

ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'opportunity_framing';
ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'success_definition';
