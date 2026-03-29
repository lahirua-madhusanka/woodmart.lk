import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { getApiErrorMessage } from "../services/apiClient";
import { createOrderApi, createPaymentIntentApi } from "../services/orderService";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const cardStyle = {
  style: {
    base: {
      color: "#1f2937",
      fontFamily: "Manrope, sans-serif",
      fontSize: "14px",
      "::placeholder": { color: "#94a3b8" },
    },
  },
};

function CheckoutInner({ stripeEnabled }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartDetailedItems, cartSubtotal } = useStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(stripeEnabled ? "stripe" : "cod");
  const [shipping, setShipping] = useState({
    fullName: user?.name || "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: "Sri Lanka",
    phone: "",
  });

  const shippingCost = useMemo(
    () => (cartSubtotal > 199 || cartSubtotal === 0 ? 0 : 18),
    [cartSubtotal]
  );
  const total = cartSubtotal + shippingCost;

  const onChangeShipping = (field) => (event) => {
    setShipping((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const nextStep = () => setCurrentStep((step) => Math.min(5, step + 1));
  const prevStep = () => setCurrentStep((step) => Math.max(1, step - 1));

  const validateShipping = () => {
    const required = ["fullName", "line1", "city", "postalCode", "country", "phone"];
    return required.every((field) => String(shipping[field]).trim().length > 0);
  };

  const placeOrder = async () => {
    if (!cartDetailedItems.length) {
      toast.info("Your cart is empty");
      return;
    }

    if (!validateShipping()) {
      toast.error("Please complete shipping details");
      return;
    }

    setIsPlacingOrder(true);

    try {
      let paymentStatus = "pending";
      let paymentIntentId = "";

      if (paymentMethod === "stripe") {
        if (!stripe || !elements) {
          toast.error("Stripe is not ready. Add VITE_STRIPE_PUBLISHABLE_KEY in your frontend .env.");
          return;
        }

        const intent = await createPaymentIntentApi({ amount: total });
        paymentIntentId = intent.paymentIntentId;

        const card = elements.getElement(CardElement);
        if (!card) {
          toast.error("Card form is not ready");
          return;
        }

        const confirmation = await stripe.confirmCardPayment(intent.clientSecret, {
          payment_method: {
            card,
            billing_details: {
              name: shipping.fullName,
              email: user?.email,
              phone: shipping.phone,
            },
          },
        });

        if (confirmation.error) {
          toast.error(confirmation.error.message || "Payment failed");
          return;
        }

        if (confirmation.paymentIntent?.status === "succeeded") {
          paymentStatus = "paid";
        } else {
          toast.error("Payment was not completed");
          return;
        }
      }

      const order = await createOrderApi({
        shippingAddress: shipping,
        paymentStatus,
        paymentIntentId,
      });

      toast.success("Order created successfully");
      navigate(`/order-confirmation/${order._id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <section className="container-pad py-10">
      <h1 className="font-display text-3xl font-bold">Checkout</h1>
      <p className="mt-2 text-sm text-muted">Step {currentStep} of 5</p>

      {!cartDetailedItems.length ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-muted">No items available for checkout.</p>
          <Link to="/shop" className="btn-primary mt-4">Go to shop</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
            {currentStep === 1 && (
              <div>
                <h2 className="text-lg font-semibold">1. Cart Review</h2>
                <div className="mt-4 space-y-3">
                  {cartDetailedItems.map((item) => (
                    <div key={item.productId} className="flex justify-between border-b border-slate-100 pb-3 text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span className="font-semibold">Rs. {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-lg font-semibold">2. Shipping Address</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input value={shipping.fullName} onChange={onChangeShipping("fullName")} placeholder="Full name" className="rounded-lg border border-slate-300 px-3 py-2" />
                  <input value={shipping.phone} onChange={onChangeShipping("phone")} placeholder="Phone" className="rounded-lg border border-slate-300 px-3 py-2" />
                  <input value={shipping.line1} onChange={onChangeShipping("line1")} placeholder="Address line 1" className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2" />
                  <input value={shipping.line2} onChange={onChangeShipping("line2")} placeholder="Address line 2" className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2" />
                  <input value={shipping.city} onChange={onChangeShipping("city")} placeholder="City" className="rounded-lg border border-slate-300 px-3 py-2" />
                  <input value={shipping.postalCode} onChange={onChangeShipping("postalCode")} placeholder="Postal code" className="rounded-lg border border-slate-300 px-3 py-2" />
                  <input value={shipping.country} onChange={onChangeShipping("country")} placeholder="Country" className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2" />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-lg font-semibold">3. Order Summary</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>Rs. {cartSubtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{shippingCost === 0 ? "Free" : `Rs. ${shippingCost.toFixed(2)}`}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><span>Total</span><span className="text-brand-dark">Rs. {total.toFixed(2)}</span></div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="text-lg font-semibold">4. Payment Selection</h2>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      className="accent-brand"
                      checked={paymentMethod === "stripe"}
                      onChange={() => setPaymentMethod("stripe")}
                      disabled={!stripeEnabled}
                    />
                    Stripe (Card)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" className="accent-brand" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} /> Cash on Delivery
                  </label>
                </div>

                {paymentMethod === "stripe" && stripeEnabled && (
                  <div className="mt-4 rounded-lg border border-slate-300 p-3">
                    <CardElement options={cardStyle} />
                  </div>
                )}
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <h2 className="text-lg font-semibold">5. Confirm Order</h2>
                <p className="mt-2 text-sm text-muted">Review details and place your order securely.</p>
                <button
                  onClick={placeOrder}
                  disabled={isPlacingOrder}
                  className="btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPlacingOrder ? "Processing..." : "Place Order"}
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button onClick={prevStep} disabled={currentStep === 1} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Back</button>
              <button onClick={nextStep} disabled={currentStep === 5} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Next</button>
            </div>
          </div>

          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Checkout Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Items</span><span>{cartDetailedItems.length}</span></div>
              <div className="flex justify-between"><span className="text-muted">Amount</span><span>Rs. {cartSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Total</span><span className="font-semibold text-brand-dark">Rs. {total.toFixed(2)}</span></div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function CheckoutPage() {
  const stripeEnabled = Boolean(stripePromise);

  if (!stripePromise) {
    return (
      <section className="container-pad py-10">
        <h1 className="font-display text-3xl font-bold">Checkout</h1>
        <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY in your frontend .env file to enable card payments.
        </p>
        <Elements stripe={null}>
          <CheckoutInner stripeEnabled={false} />
        </Elements>
      </section>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutInner stripeEnabled={stripeEnabled} />
    </Elements>
  );
}

export default CheckoutPage;
