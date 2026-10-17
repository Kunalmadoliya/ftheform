"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpayCheckout() {
  const creditsQuery = trpc.payment.getUserCredits.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 15_000,
  });

  const createOrderMutation = trpc.payment.createOrder.useMutation();
  const verifyPaymentMutation = trpc.payment.verifyPayment.useMutation();

  const [loadingStep, setLoadingStep] = useState<"idle" | "creating" | "verifying">("idle");

  const isPending = loadingStep !== "idle";
  const loadingLabel =
    loadingStep === "creating"
      ? "Starting payment..."
      : loadingStep === "verifying"
        ? "Verifying payment..."
        : "";

  async function buyCredits() {
    if (isPending) return;

    setLoadingStep("creating");
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Could not load Razorpay payment gateway. Please check your internet connection.");
        setLoadingStep("idle");
        return;
      }

      const order = await createOrderMutation.mutateAsync();

      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "FTHEFORM",
        description: "20 Form Generations",
        order_id: order.orderId,
        theme: {
          color: "#2563eb",
        },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          setLoadingStep("verifying");
          try {
            await verifyPaymentMutation.mutateAsync({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            toast.success("Payment verified! 20 credits added to your account.");
            await creditsQuery.refetch();
          } catch (verifyError) {
            // If verifyPayment fails after a successful payment, show a message that credits
            // will be added shortly because the webhook will confirm it, and refetch after a few seconds.
            toast.info(
              "Payment received! Your credits will appear shortly once confirmed.",
              { duration: 6000 },
            );
            setTimeout(() => {
              void creditsQuery.refetch();
            }, 4000);
          } finally {
            setLoadingStep("idle");
          }
        },
        modal: {
          ondismiss: function () {
            // Popup closed: no error toast, just reset button state
            setLoadingStep("idle");
          },
        },
      });

      rzp.on("payment.failed", function (err: any) {
        setLoadingStep("idle");
        const description =
          err?.error?.description || "Payment failed or was canceled. Please try again.";
        toast.error(description);
      });

      rzp.open();
    } catch (err: unknown) {
      setLoadingStep("idle");
      toast.error(
        getTrpcErrorMessage(err, "Unable to initiate payment order. Please try again later."),
      );
    }
  }

  return {
    credits: creditsQuery.data?.credits ?? 0,
    dailyFreeRemaining: creditsQuery.data?.dailyFreeRemaining ?? 0,
    isLoadingCredits: creditsQuery.isLoading,
    refetchCredits: creditsQuery.refetch,
    buyCredits,
    isBuying: isPending,
    buyingLabel: loadingLabel,
  };
}
