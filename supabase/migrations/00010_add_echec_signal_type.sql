-- Add 'echec' to signal_type enum
-- Used to flag CRs reporting a failure / lost deal / bad interaction
-- that doesn't fit concurrence/prix/besoin/etc.

ALTER TYPE signal_type ADD VALUE IF NOT EXISTS 'echec';
