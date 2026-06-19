import LegalPageLayout from "../components/legal/LegalPageLayout";

const sections = [
  {
    title: "Introduction",
    body: [
      "These Business Terms & Conditions explain the rules that apply when you use Woodmart.lk, create an account, place an order, submit content, or purchase handcrafted wooden products from us.",
      "Woodmart.lk provides ecommerce services for customers in Sri Lanka, including ready-made and custom-made wooden products.",
    ],
  },
  {
    title: "Acceptance of Terms",
    body: [
      "By accessing Woodmart.lk, creating an account, using Google Login, placing an order, or submitting a review, you agree to these terms. If you do not agree, please do not use the website or place an order.",
    ],
  },
  {
    title: "Products & Availability",
    body: [
      "Our products include handcrafted wooden items and related lifestyle products. Availability may change due to stock levels, material availability, production schedules, and the nature of handmade work.",
      "We may update, limit, or discontinue products at any time without prior notice.",
    ],
  },
  {
    title: "Pricing",
    body: [
      "Product prices are displayed on the website and may change based on material cost, product size, customization requirements, promotions, delivery charges, or business updates.",
      "If a pricing error is discovered, Woodmart.lk may contact the customer to correct the order, request confirmation, or cancel the affected order.",
    ],
  },
  {
    title: "Promotions & Discount Codes",
    body: [
      "Promotions, coupons, and discount codes are subject to their displayed conditions, including validity dates, minimum order values, product eligibility, usage limits, and availability.",
      "Woodmart.lk may modify or withdraw promotions if there is misuse, technical error, or business need.",
    ],
  },
  {
    title: "Orders & Order Confirmation",
    body: [
      "An order is confirmed after the required customer details are submitted and the payment or selected payment method is accepted according to the checkout flow.",
      "We may contact customers to verify order details, delivery information, customization requests, or payment status before processing.",
    ],
  },
  {
    title: "Payment Terms",
    body: [
      "Customers must provide accurate payment and billing information. Orders may be delayed or cancelled if payment cannot be verified or if payment details are incomplete.",
      "Payment providers may apply their own terms, security checks, and processing rules.",
    ],
  },
  {
    title: "Shipping & Delivery",
    body: [
      "Woodmart.lk delivers within Sri Lanka. Delivery timeframes depend on destination, courier availability, product availability, order volume, weather conditions, public holidays, and custom product preparation time.",
      "Customers are responsible for providing a complete and accurate delivery address and reachable phone number.",
    ],
  },
  {
    title: "Order Cancellation Policy",
    body: [
      "Customers should contact us as soon as possible if they wish to cancel an order. Cancellation may not be possible after an order has been packed, handed to delivery, customized, engraved, specially produced, or otherwise prepared specifically for the customer.",
      "Woodmart.lk may cancel orders due to unavailable stock, payment issues, incorrect pricing, suspected misuse, delivery limitations, or inability to contact the customer.",
    ],
  },
  {
    title: "Returns & Refunds",
    body: [
      "Returns and refunds are handled according to our Returns & Refunds policy. Products must generally be unused, in suitable condition, and reported within the applicable timeframe.",
      "Custom-made, personalized, engraved, or specially requested items may not be eligible for return unless they are damaged, incorrect, or defective according to our review.",
    ],
  },
  {
    title: "Product Variations & Natural Wood Characteristics",
    body: [
      "Wood is a natural material and each handcrafted product is unique. Natural wood grain differences, tone changes, knots, mineral marks, color variation, and handmade finishing differences may appear from item to item.",
      "These characteristics are not defects. They are part of the natural beauty and handmade character of wooden products. Product photos are provided as accurate visual guidance, but the final item may vary slightly in grain, shade, and surface pattern.",
    ],
    points: [
      "Natural grain and color differences are expected.",
      "Small handmade variations reflect the crafting process.",
      "Wood may deepen in tone with use, oiling, and exposure to normal light.",
    ],
  },
  {
    title: "Customer Responsibilities",
    body: [
      "Customers must provide accurate account, order, delivery, and contact information. Customers are responsible for reviewing order details before checkout and for following product care instructions after delivery.",
      "Improper use, poor maintenance, water damage, heat exposure, or failure to follow care guidance may affect product durability and may not be covered by return or refund support.",
    ],
  },
  {
    title: "Account Registration",
    body: [
      "Customers may create an account to manage orders, reviews, and personal details. You are responsible for maintaining account security and for all activity that occurs under your account.",
      "Woodmart.lk may restrict or suspend accounts involved in misuse, fraudulent activity, abusive behavior, or policy violations.",
    ],
  },
  {
    title: "Google Login",
    body: [
      "Customers may use Google Login where available. By using Google Login, you authorize Woodmart.lk to receive basic profile information needed to create or authenticate your account.",
      "Google Login does not remove your responsibility to keep your account secure and to use the website according to these terms.",
    ],
  },
  {
    title: "Reviews & User Content",
    body: [
      "Customers may submit reviews, ratings, comments, images, or messages. By submitting content, you confirm that it is truthful, lawful, respectful, and relevant to the product or service.",
      "Woodmart.lk may moderate, remove, or refuse content that is misleading, offensive, spam, unrelated, unlawful, or harmful to other customers or the business.",
    ],
  },
  {
    title: "Intellectual Property",
    body: [
      "Website content, product images, branding, layouts, text, graphics, and other materials on Woodmart.lk are owned by or licensed to Woodmart.lk unless otherwise stated.",
      "Customers may not copy, reproduce, distribute, or commercially use website content without written permission.",
    ],
  },
  {
    title: "Limitation of Liability",
    body: [
      "Woodmart.lk aims to provide accurate product information and reliable service, but website access, product availability, delivery timing, and third-party services may be affected by factors outside our control.",
      "To the extent permitted by applicable law, Woodmart.lk is not liable for indirect losses, misuse of products, delays caused by third parties, or issues caused by inaccurate customer information.",
    ],
  },
  {
    title: "Changes to Terms",
    body: [
      "Woodmart.lk may update these terms from time to time. Updated terms will be posted on this page and will apply to website use and orders after publication.",
    ],
  },
  {
    title: "Contact Information",
    body: [
      "For questions about these terms, orders, cancellations, delivery, returns, or custom products, please contact Woodmart.lk through the contact page, by email at support@woodmart.lk, or through the phone number listed on our website.",
    ],
  },
];

function TermsAndConditionsPage() {
  return (
    <LegalPageLayout
      eyebrow="Woodmart.lk Business Terms"
      title="Business Terms & Conditions"
      description="The terms that govern customer accounts, orders, payments, delivery, promotions, reviews, and handcrafted product expectations."
      seoTitle="Business Terms & Conditions | Woodmart.lk"
      seoDescription="Read the terms and conditions governing the use of Woodmart.lk, including orders, payments, delivery, promotions, and customer responsibilities."
      highlights={[
        "Terms cover ecommerce orders, custom products, delivery, and cancellations.",
        "Natural grain, color, and handmade variations are expected characteristics.",
        "Customers are responsible for accurate details and proper product care.",
      ]}
      sections={sections}
    />
  );
}

export default TermsAndConditionsPage;
