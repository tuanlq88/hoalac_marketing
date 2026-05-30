export const EVENTS = {
  LEAD_FORM_VIEW: 'lead_form_view',
  LEAD_FORM_OPEN: 'lead_form_open',
  LEAD_STEP_COMPLETE: 'lead_step_complete',
  LEAD_FORM_SUBMIT: 'lead_form_submit',
  LEAD_FORM_ABANDON: 'lead_form_abandon',
  PHONE_FIELD_INTERACT: 'phone_field_interact',
  CTA_CLICK: 'cta_click',
  READER_MILESTONE: 'reader_milestone',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export const FORM_OUTCOME = {
  OPENED: 'opened',
  ABANDONED_AT_NAME: 'abandoned_at_name',
  ABANDONED_AT_INTENT: 'abandoned_at_intent',
  ABANDONED_AT_BUDGET: 'abandoned_at_budget',
  ABANDONED_AT_PRIORITY: 'abandoned_at_priority',
  ABANDONED_AT_CONTACT: 'abandoned_at_contact',
  SUBMITTED: 'submitted',
} as const;

export type FormOutcome = (typeof FORM_OUTCOME)[keyof typeof FORM_OUTCOME];
