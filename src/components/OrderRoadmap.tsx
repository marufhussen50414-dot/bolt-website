import { Check, X } from "lucide-react";
import { classNames } from "../lib/utils";
import type { OrderStatus } from "../lib/types";

type Role = "buyer" | "seller";

/* =========================================================================
   ROADMAP DIALOGUE TEXT — SELLER
   Edit the strings below to change what a SELLER sees under each step.
   Every line is tagged with a comment naming the exact status it belongs
   to — search for "dialogue for" to jump between them.
   ========================================================================= */
const SELLER_DIALOGUES = {
  orderPlacedUnderChecking: "The buyer's payment is under processing.", // dialogue for under checking (seller)
  orderPlacedPaid: "The buyer's payment was successful.", // dialogue for paid (seller)
  paymentReceivedInEscrow: "Payment is safely held in escrow until the order is completed.", // dialogue for in escrow (seller)
  submitInfoPending: "Please submit the account details to continue.", // dialogue for pending (seller)
  submitInfoSubmitted: "You've submitted the account details.", // dialogue for submitted (seller)
  transferChecking: "We're verifying the account transfer. This usually finishes within 23:59.", // dialogue for checking (23:59) (seller)
  transferApproved: "Account transfer verified and approved.", // dialogue for approved (seller)
  transferDisputed: "This order has been marked as disputed. Our team is reviewing it.", // dialogue for disputed (seller)
  payoutProcessing: "Your payout is being processed.", // dialogue for processing (seller)
  payoutReleased: "Your payout has been released to your wallet.", // dialogue for released to wallet (seller)
};

/* =========================================================================
   ROADMAP DIALOGUE TEXT — BUYER
   Edit the strings below to change what a BUYER sees under each step.
   Every line is tagged with a comment naming the exact status it belongs
   to — search for "dialogue for" to jump between them.
   ========================================================================= */
const BUYER_DIALOGUES = {
  orderPlacedUnderChecking: "Your payment is under processing.", // dialogue for under checking (buyer)
  orderPlacedPaid: "Your payment was successful.", // dialogue for paid (buyer)
  paymentReceivedInEscrow: "Your payment is safely held in escrow until the order is completed.", // dialogue for in escrow (buyer)
  waitingInfoWaiting: "Waiting for the seller to submit the account details.", // dialogue for waiting (buyer)
  waitingInfoReceived: "The seller has submitted the account details.", // dialogue for received (buyer)
  transferChecking: "We're verifying the account transfer. This usually finishes within 23:59.", // dialogue for checking (23:59) (buyer)
  transferApproved: "Account transfer verified and approved.", // dialogue for approved (buyer)
  transferDisputed: "This order has been marked as disputed. Our team is reviewing it.", // dialogue for disputed (buyer)
  paymentProcessing: "Your payment is being processed.", // dialogue for processing (buyer)
  paymentReleased: "Your payment has been released to the seller.", // dialogue for released to seller (buyer)
};

/* =========================================================================
   STEP DEFINITIONS — per role
   Each step has a title, a label + dialogue for its "active" (in-progress)
   state, and for its "done" (completed) state. Step 4 also has a
   "disputed" variant. Titles/labels differ slightly between buyer and
   seller (e.g. "Submit Account Info" vs "Waiting for Account Info").
   ========================================================================= */
const STEP_META: Record<Role, { title: string; labels: { active: string; done: string; disputed?: string }; dialogues: { active: string; done: string; disputed?: string } }[]> = {
  seller: [
    {
      title: "Order Placed",
      labels: { active: "Under Checking", done: "Paid" },
      dialogues: { active: SELLER_DIALOGUES.orderPlacedUnderChecking, done: SELLER_DIALOGUES.orderPlacedPaid },
    },
    {
      title: "Payment Received",
      labels: { active: "In Escrow", done: "In Escrow" },
      dialogues: { active: SELLER_DIALOGUES.paymentReceivedInEscrow, done: SELLER_DIALOGUES.paymentReceivedInEscrow },
    },
    {
      title: "Submit Account Info",
      labels: { active: "Pending", done: "Submitted" },
      dialogues: { active: SELLER_DIALOGUES.submitInfoPending, done: SELLER_DIALOGUES.submitInfoSubmitted },
    },
    {
      title: "Account Transfer & Verification",
      labels: { active: "Checking (23:59)", done: "Approved", disputed: "Disputed" },
      dialogues: { active: SELLER_DIALOGUES.transferChecking, done: SELLER_DIALOGUES.transferApproved, disputed: SELLER_DIALOGUES.transferDisputed },
    },
    {
      title: "Payout Status",
      labels: { active: "Processing", done: "Released to Wallet" },
      dialogues: { active: SELLER_DIALOGUES.payoutProcessing, done: SELLER_DIALOGUES.payoutReleased },
    },
  ],
  buyer: [
    {
      title: "Order Placed",
      labels: { active: "Under Checking", done: "Paid" },
      dialogues: { active: BUYER_DIALOGUES.orderPlacedUnderChecking, done: BUYER_DIALOGUES.orderPlacedPaid },
    },
    {
      title: "Payment Received",
      labels: { active: "In Escrow", done: "In Escrow" },
      dialogues: { active: BUYER_DIALOGUES.paymentReceivedInEscrow, done: BUYER_DIALOGUES.paymentReceivedInEscrow },
    },
    {
      title: "Waiting for Account Info",
      labels: { active: "Waiting", done: "Received" },
      dialogues: { active: BUYER_DIALOGUES.waitingInfoWaiting, done: BUYER_DIALOGUES.waitingInfoReceived },
    },
    {
      title: "Account Transfer & Verification",
      labels: { active: "Checking (23:59)", done: "Approved", disputed: "Disputed" },
      dialogues: { active: BUYER_DIALOGUES.transferChecking, done: BUYER_DIALOGUES.transferApproved, disputed: BUYER_DIALOGUES.transferDisputed },
    },
    {
      title: "Payment Processing",
      labels: { active: "Processing", done: "Released to Seller" },
      dialogues: { active: BUYER_DIALOGUES.paymentProcessing, done: BUYER_DIALOGUES.paymentReleased },
    },
  ],
};

/* =========================================================================
   STATUS -> STEP MAPPING
   Which step number (1-5) an order.status currently sits on. Edit this if
   the order flow changes. Same mapping applies to both roles.
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

function buildSteps(status: OrderStatus | string, role: Role): RoadmapStep[] {
  const currentStep = STATUS_TO_STEP[status] ?? 1;
  const isDisputed = status === "disputed";
  const meta = STEP_META[role];

  return meta.map((m, idx) => {
    const stepNum = idx + 1;

    if (isDisputed && stepNum === 4) {
      return { title: m.title, label: m.labels.disputed ?? m.labels.active, dialogue: m.dialogues.disputed ?? m.dialogues.active, state: "disputed" };
    }
    if (stepNum < currentStep) {
      return { title: m.title, label: m.labels.done, dialogue: m.dialogues.done, state: "completed" };
    }
    if (stepNum === currentStep) {
      return { title: m.title, label: m.labels.active, dialogue: m.dialogues.active, state: "active" };
    }
    return { title: m.title, label: m.labels.active, dialogue: m.dialogues.active, state: "upcoming" };
  });
}

export default function OrderRoadmap({ status, role }: { status: OrderStatus | string; role: Role }) {
  const steps = buildSteps(status, role);

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
