import { Check, X } from "lucide-react";
import { classNames } from "../lib/utils";
import type { OrderStatus } from "../lib/types";

/* =========================================================================
   ROADMAP DIALOGUE TEXT
   Edit the strings below to change what appears under each step. Every
   line is tagged with a comment naming the exact status it belongs to —
   search for "dialogue for" to jump between them.
   ========================================================================= */
const DIALOGUES = {
  orderPlacedUnderChecking: "Your payment is under processing.", // dialogue for under checking
  orderPlacedPaid: "Your payment was successful.", // dialogue for paid
  paymentReceivedInEscrow: "Your payment is safely held in escrow until the order is completed.", // dialogue for in escrow
  submitInfoPending: "Waiting for the seller to submit the account details.", // dialogue for pending
  submitInfoSubmitted: "The seller has submitted the account details.", // dialogue for submitted
  transferChecking: "We're verifying the account transfer. This usually finishes within 23:59.", // dialogue for checking (23:59)
  transferApproved: "Account transfer verified and approved.", // dialogue for approved
  transferDisputed: "This order has been marked as disputed. Our team is reviewing it.", // dialogue for disputed
  payoutProcessing: "Your payout is being processed.", // dialogue for processing
  payoutReleased: "Your payout has been released to your wallet.", // dialogue for released to wallet
};

/* =========================================================================
   STEP DEFINITIONS
   Each step has a label + dialogue for its "active" (in-progress) state
   and its "done" (completed) state. Step 4 also has a "disputed" variant.
   ========================================================================= */
const STEP_META = [
  {
    title: "Order Placed",
    labels: { active: "Under Checking", done: "Paid" },
    dialogues: { active: DIALOGUES.orderPlacedUnderChecking, done: DIALOGUES.orderPlacedPaid },
  },
  {
    title: "Payment Received",
    labels: { active: "In Escrow", done: "In Escrow" },
    dialogues: { active: DIALOGUES.paymentReceivedInEscrow, done: DIALOGUES.paymentReceivedInEscrow },
  },
  {
    title: "Submit Account Info",
    labels: { active: "Pending", done: "Submitted" },
    dialogues: { active: DIALOGUES.submitInfoPending, done: DIALOGUES.submitInfoSubmitted },
  },
  {
    title: "Account Transfer & Verification",
    labels: { active: "Checking (23:59)", done: "Approved", disputed: "Disputed" },
    dialogues: { active: DIALOGUES.transferChecking, done: DIALOGUES.transferApproved, disputed: DIALOGUES.transferDisputed },
  },
  {
    title: "Payout Status",
    labels: { active: "Processing", done: "Released to Wallet" },
    dialogues: { active: DIALOGUES.payoutProcessing, done: DIALOGUES.payoutReleased },
  },
];

/* =========================================================================
   STATUS -> STEP MAPPING
   Which step number (1-5) an order.status currently sits on. Edit this if
   the order flow changes.
   ========================================================================= */
const STATUS_TO_STEP: Record<string, number> = {
  pending: 1,
  paid: 2,
  delivering: 4,
  completed: 5,
  disputed: 4,
  cancelled: 1,
  refunded: 1,
};

type StepState = "completed" | "active" | "disputed" | "upcoming";

type RoadmapStep = {
  title: string;
  label: string;
  dialogue: string;
  state: StepState;
};

function buildSteps(status: OrderStatus | string): RoadmapStep[] {
  const currentStep = STATUS_TO_STEP[status] ?? 1;
  const isDisputed = status === "disputed";

  return STEP_META.map((meta, idx) => {
    const stepNum = idx + 1;

    if (isDisputed && stepNum === 4) {
      return { title: meta.title, label: meta.labels.disputed ?? meta.labels.active, dialogue: meta.dialogues.disputed ?? meta.dialogues.active, state: "disputed" };
    }
    if (stepNum < currentStep) {
      return { title: meta.title, label: meta.labels.done, dialogue: meta.dialogues.done, state: "completed" };
    }
    if (stepNum === currentStep) {
      return { title: meta.title, label: meta.labels.active, dialogue: meta.dialogues.active, state: "active" };
    }
    return { title: meta.title, label: meta.labels.active, dialogue: meta.dialogues.active, state: "upcoming" };
  });
}

export default function OrderRoadmap({ status }: { status: OrderStatus | string }) {
  const steps = buildSteps(status);

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
