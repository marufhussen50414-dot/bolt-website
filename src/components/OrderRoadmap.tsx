import { Check, X } from "lucide-react";
import { classNames } from "../lib/utils";

type Role = "buyer" | "seller";

/* =========================================================================
   The 10 exact workflow statuses written by the Control Room admin panel
   (see control-room/lib/workflow.ts — this file mirrors it 1:1 so both
   apps always agree on what each status means).
   ========================================================================= */
export type WorkflowStatus =
  | "step1_checking" | "step1_paid"
  | "step2_escrow"
  | "step3_pending" | "step3_submitted"
  | "step4_checking" | "step4_approved" | "step4_disputed"
  | "step5_processing" | "step5_released";

const DEFAULT_WORKFLOW_STATUS: WorkflowStatus = "step1_checking";

/* =========================================================================
   ROADMAP DIALOGUE TEXT — SELLER
   Edit the strings below to change what a SELLER sees under each step.
   ========================================================================= */
const SELLER_DIALOGUES = {
  orderPlacedUnderChecking: "The buyer's payment is under processing.",
  orderPlacedPaid: "The buyer's payment was successful.",
  paymentReceivedInEscrow: "Payment is safely held in escrow until the order is completed.",
  submitInfoPending: "Please submit the account details to continue.",
  submitInfoSubmitted: "You've submitted the account details.",
  transferChecking: "We're verifying the account transfer. This usually finishes within 23:59.",
  transferApproved: "Account transfer verified and approved.",
  transferDisputed: "This order has been marked as disputed. Our team is reviewing it.",
  payoutProcessing: "Your payout is being processed.",
  payoutReleased: "Your payout has been released to your wallet.",
};

/* =========================================================================
   ROADMAP DIALOGUE TEXT — BUYER
   ========================================================================= */
const BUYER_DIALOGUES = {
  orderPlacedUnderChecking: "Your payment is under processing.",
  orderPlacedPaid: "Your payment was successful.",
  paymentReceivedInEscrow: "Your payment is safely held in escrow until the order is completed.",
  waitingInfoWaiting: "Waiting for the seller to submit the account details.",
  waitingInfoReceived: "The seller has submitted the account details.",
  transferChecking: "We're verifying the account transfer. This usually finishes within 23:59.",
  transferApproved: "Account transfer verified and approved.",
  transferDisputed: "This order has been marked as disputed. Our team is reviewing it.",
  paymentProcessing: "Your payment is being processed.",
  paymentReleased: "Your payment has been released to the seller.",
};

/* =========================================================================
   STEP TITLES — per role (title only, doesn't change with sub-status)
   ========================================================================= */
const STEP_TITLES: Record<Role, string[]> = {
  seller: [
    "Order Placed",
    "Payment Received",
    "Submit Account Info",
    "Account Transfer & Verification",
    "Payout Status",
  ],
  buyer: [
    "Order Placed",
    "Payment Received",
    "Waiting for Account Info",
    "Account Transfer & Verification",
    "Payment Processing",
  ],
};

/* =========================================================================
   STATUS META — every one of the 10 exact statuses the Control Room can
   write, with which step (1-5) it belongs to, the label + dialogue each
   role sees, and whether it's the "disputed" branch of step 4.
   ========================================================================= */
type StatusMeta = {
  step: number;
  sellerLabel: string;
  buyerLabel: string;
  sellerDialogue: string;
  buyerDialogue: string;
  disputed?: boolean;
};

const STATUS_META: Record<WorkflowStatus, StatusMeta> = {
  step1_checking: {
    step: 1, sellerLabel: "Under Checking", buyerLabel: "Under Checking",
    sellerDialogue: SELLER_DIALOGUES.orderPlacedUnderChecking, buyerDialogue: BUYER_DIALOGUES.orderPlacedUnderChecking,
  },
  step1_paid: {
    step: 1, sellerLabel: "Paid", buyerLabel: "Paid",
    sellerDialogue: SELLER_DIALOGUES.orderPlacedPaid, buyerDialogue: BUYER_DIALOGUES.orderPlacedPaid,
  },
  step2_escrow: {
    step: 2, sellerLabel: "In Escrow", buyerLabel: "In Escrow",
    sellerDialogue: SELLER_DIALOGUES.paymentReceivedInEscrow, buyerDialogue: BUYER_DIALOGUES.paymentReceivedInEscrow,
  },
  step3_pending: {
    step: 3, sellerLabel: "Pending", buyerLabel: "Waiting",
    sellerDialogue: SELLER_DIALOGUES.submitInfoPending, buyerDialogue: BUYER_DIALOGUES.waitingInfoWaiting,
  },
  step3_submitted: {
    step: 3, sellerLabel: "Submitted", buyerLabel: "Received",
    sellerDialogue: SELLER_DIALOGUES.submitInfoSubmitted, buyerDialogue: BUYER_DIALOGUES.waitingInfoReceived,
  },
  step4_checking: {
    step: 4, sellerLabel: "Checking (23:59)", buyerLabel: "Checking (23:59)",
    sellerDialogue: SELLER_DIALOGUES.transferChecking, buyerDialogue: BUYER_DIALOGUES.transferChecking,
  },
  step4_approved: {
    step: 4, sellerLabel: "Approved", buyerLabel: "Approved",
    sellerDialogue: SELLER_DIALOGUES.transferApproved, buyerDialogue: BUYER_DIALOGUES.transferApproved,
  },
  step4_disputed: {
    step: 4, sellerLabel: "Disputed", buyerLabel: "Disputed",
    sellerDialogue: SELLER_DIALOGUES.transferDisputed, buyerDialogue: BUYER_DIALOGUES.transferDisputed,
    disputed: true,
  },
  step5_processing: {
    step: 5, sellerLabel: "Processing", buyerLabel: "Processing",
    sellerDialogue: SELLER_DIALOGUES.payoutProcessing, buyerDialogue: BUYER_DIALOGUES.paymentProcessing,
  },
  step5_released: {
    step: 5, sellerLabel: "Released to Wallet", buyerLabel: "Released to Seller",
    sellerDialogue: SELLER_DIALOGUES.payoutReleased, buyerDialogue: BUYER_DIALOGUES.paymentReleased,
  },
};

// Once a step is behind the current one, it must have finished via its
// "advancing" status — this is what a completed step displays.
const DONE_STATUS_BY_STEP: Record<number, WorkflowStatus> = {
  1: "step1_paid",
  2: "step2_escrow",
  3: "step3_submitted",
  4: "step4_approved",
  5: "step5_released",
};

// The starting (not-yet-advanced) status of each step — only used as a
// placeholder for "upcoming" steps, whose label/dialogue are never shown.
const START_STATUS_BY_STEP: Record<number, WorkflowStatus> = {
  1: "step1_checking",
  2: "step2_escrow",
  3: "step3_pending",
  4: "step4_checking",
  5: "step5_processing",
};

function normalizeWorkflowStatus(value: string | null | undefined): WorkflowStatus {
  if (value && value in STATUS_META) return value as WorkflowStatus;
  return DEFAULT_WORKFLOW_STATUS;
}

export function getWorkflowStatusMeta(workflowStatus: string | null | undefined, role: Role) {
  const status = normalizeWorkflowStatus(workflowStatus);
  const meta = STATUS_META[status];
  return {
    label: metaLabel(meta, role),
    isFinal: status === "step5_released",
    isDisputed: !!meta.disputed,
  };
}

type StepState = "completed" | "active" | "disputed" | "upcoming";

type RoadmapStep = {
  title: string;
  label: string;
  dialogue: string;
  state: StepState;
};

function metaLabel(meta: StatusMeta, role: Role) {
  return role === "seller" ? meta.sellerLabel : meta.buyerLabel;
}
function metaDialogue(meta: StatusMeta, role: Role) {
  return role === "seller" ? meta.sellerDialogue : meta.buyerDialogue;
}

function buildSteps(workflowStatus: string | null | undefined, role: Role): RoadmapStep[] {
  const status = normalizeWorkflowStatus(workflowStatus);
  const current = STATUS_META[status];
  const currentStep = current.step;
  const isDisputed = !!current.disputed;
  const titles = STEP_TITLES[role];

  return titles.map((title, idx) => {
    const stepNum = idx + 1;

    if (isDisputed && stepNum === 4) {
      return { title, label: metaLabel(current, role), dialogue: metaDialogue(current, role), state: "disputed" };
    }
    if (stepNum < currentStep) {
      const meta = STATUS_META[DONE_STATUS_BY_STEP[stepNum]];
      return { title, label: metaLabel(meta, role), dialogue: metaDialogue(meta, role), state: "completed" };
    }
    if (stepNum === currentStep) {
      return { title, label: metaLabel(current, role), dialogue: metaDialogue(current, role), state: "active" };
    }
    const meta = STATUS_META[START_STATUS_BY_STEP[stepNum]];
    return { title, label: metaLabel(meta, role), dialogue: metaDialogue(meta, role), state: "upcoming" };
  });
}

export default function OrderRoadmap({ workflowStatus, role }: { workflowStatus: string | null | undefined; role: Role }) {
  const steps = buildSteps(workflowStatus, role);

  return (
    <div className="py-1">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={step.title} className="relative flex gap-4">
            {/* Connector line to the next node */}
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 overflow-hidden -translate-x-1/2">
                <div className={classNames("h-full w-full", step.state === "completed" ? "bg-success-500" : "bg-ink-800")} />
                {step.state === "active" && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 h-3 w-3 rounded-full bg-primary-400 shadow-glow animate-road-flow" />
                )}
              </div>
            )}

            {/* Node */}
            <div className="relative z-10 shrink-0 pb-8 h-10 w-10 flex items-start justify-center">
              {step.state === "completed" && (
                <div className="h-6 w-6 rounded-full bg-success-500 grid place-items-center text-white shadow-md">
                  <Check size={13} strokeWidth={3} />
                </div>
              )}
              {step.state === "active" && (
                <span className="relative flex h-10 w-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-60" />
                  <span className="relative inline-flex h-10 w-10 rounded-full bg-primary-500 items-center justify-center text-white text-sm font-bold shadow-glow ring-4 ring-primary-500/20">
                    {i + 1}
                  </span>
                </span>
              )}
              {step.state === "disputed" && (
                <span className="relative flex h-10 w-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-60" />
                  <span className="relative inline-flex h-10 w-10 rounded-full bg-error-500 items-center justify-center text-white shadow-md ring-4 ring-error-500/20">
                    <X size={18} strokeWidth={3} />
                  </span>
                </span>
              )}
              {step.state === "upcoming" && (
                <div className="h-6 w-6 rounded-full border-2 border-ink-700 bg-ink-900 grid place-items-center text-ink-600 text-[10px] font-bold">
                  {i + 1}
                </div>
              )}
            </div>

            {/* Info */}
            <div className={classNames("flex-1 pb-8", step.state === "active" || step.state === "disputed" ? "pt-2" : "pt-1")}>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={classNames(
                  step.state === "active" || step.state === "disputed" ? "text-base font-bold" : "text-sm font-semibold",
                  step.state === "upcoming" ? "text-ink-500" : "text-white"
                )}>
                  {step.title}
                </h4>
                {step.state !== "upcoming" && (
                  <span className={classNames(
                    "badge border px-2 py-0.5 text-[10px] font-semibold",
                    step.state === "completed" && "bg-success-500/15 text-success-400 border-success-500/30",
                    step.state === "active" && "bg-primary-500/15 text-primary-300 border-primary-500/30",
                    step.state === "disputed" && "bg-error-500/15 text-error-400 border-error-500/30"
                  )}>
                    {step.label}
                  </span>
                )}
              </div>
              {step.state !== "upcoming" && (
                <p className={classNames("mt-1", step.state === "active" || step.state === "disputed" ? "text-sm text-ink-300" : "text-xs text-ink-500")}>
                  {step.dialogue}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
