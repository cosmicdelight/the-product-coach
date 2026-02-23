/*
  # Add collaborator notification types to enum

  Adds two missing values to the notification_type enum:
  - collaborator_joined: sent to proposal owner when a collaborator accepts their invite
  - collaborator_submitted: sent to active collaborators when a proposal is submitted
  - collaborator_invited: sent to a user when they are invited to collaborate on a proposal
*/

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'collaborator_joined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'collaborator_submitted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'collaborator_invited';
