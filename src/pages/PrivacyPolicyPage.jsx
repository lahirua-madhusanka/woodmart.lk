import LegalPageLayout from "../components/legal/LegalPageLayout";

const sections = [
  {
    title: "Introduction",
    body: [
      "This Privacy Policy explains how Woodmart.lk collects, uses, stores, and protects personal information when customers visit our website, create an account, place an order, submit a review, or contact our team.",
      "Woodmart.lk is an ecommerce website focused on handcrafted wooden products for customers in Sri Lanka. We aim to handle customer information in a clear, respectful, and responsible manner.",
    ],
  },
  {
    title: "Information We Collect",
    body: [
      "We may collect information such as your name, email address, phone number, billing and delivery address, account login details, order history, product review content, and messages sent through our website.",
      "We may also collect technical information such as device type, browser details, IP address, approximate location, pages visited, and website usage activity through cookies and analytics tools.",
    ],
  },
  {
    title: "How We Use Information",
    body: [
      "We use customer information to operate the website, manage accounts, process orders, arrange delivery, provide customer support, send order updates, improve our products, prevent misuse, and maintain website security.",
    ],
    points: [
      "To confirm orders and communicate delivery updates.",
      "To personalize account and shopping experiences.",
      "To improve website performance, product selection, and customer service.",
    ],
  },
  {
    title: "Account Registration",
    body: [
      "When you register for a Woodmart.lk account, we store information needed to identify your account, manage your profile, keep order history, save customer activity related to purchases, and help you access account features securely.",
      "You are responsible for keeping your login details private and for notifying us if you believe your account has been accessed without permission.",
    ],
  },
  {
    title: "Orders & Payments",
    body: [
      "When you place an order, we collect the information needed to prepare, confirm, and deliver handcrafted wooden products. This may include customer name, phone number, email address, delivery address, ordered items, order notes, payment status, and order history.",
      "Payment information may be processed through trusted payment providers. Woodmart.lk does not intentionally store full card details on the website.",
    ],
  },
  {
    title: "Google Login & Authentication",
    body: [
      "If you choose Google Login, we may receive basic profile information from Google, such as your name and email address, to create or authenticate your Woodmart.lk account.",
      "We use this information only for account access, identity verification, and customer service related to your use of Woodmart.lk.",
    ],
  },
  {
    title: "Cookies & Analytics",
    body: [
      "Woodmart.lk may use cookies and similar technologies to keep the website working correctly, remember preferences, support account sessions, measure performance, and understand how visitors use the website.",
      "We may use Google Analytics to review aggregated website activity such as page views, traffic sources, and user interactions. This helps us improve the ecommerce experience.",
    ],
  },
  {
    title: "Product Reviews",
    body: [
      "Customers may submit product reviews, ratings, names, and comments. Reviews may be displayed publicly on product pages or other website areas to help customers make informed decisions.",
      "We may moderate reviews to remove spam, abusive content, misleading claims, or content unrelated to the purchased product.",
    ],
  },
  {
    title: "Data Security",
    body: [
      "We use reasonable technical and organizational measures to protect customer data from unauthorized access, misuse, loss, or alteration. However, no online system can be guaranteed to be completely secure.",
      "Customer data may be stored in Supabase and handled through access controls, application security practices, and service-level protections.",
    ],
  },
  {
    title: "Third-Party Services",
    body: [
      "Woodmart.lk may use third-party services to operate key features of the website, including Google Login, Google Analytics, Supabase database services, ImageKit image hosting and optimization, email notification services, delivery partners, and payment providers.",
      "These services may process data according to their own privacy and security practices when required to provide their services.",
    ],
  },
  {
    title: "User Rights",
    body: [
      "Customers may contact Woodmart.lk to request access to their personal information, correction of inaccurate details, deletion of account information where legally and operationally possible, or clarification about how their data is used.",
      "Some records, such as order and transaction details, may need to be retained for accounting, customer service, fraud prevention, or legal compliance purposes.",
    ],
  },
  {
    title: "Changes to Privacy Policy",
    body: [
      "We may update this Privacy Policy from time to time to reflect website changes, new services, operational updates, or legal requirements. Updated versions will be posted on this page.",
    ],
  },
  {
    title: "Contact Information",
    body: [
      "For privacy questions, account requests, or data-related concerns, please contact Woodmart.lk through the contact page, by email at support@woodmart.lk, or through the phone number listed on our website.",
    ],
  },
];

function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Woodmart.lk Privacy"
      title="Privacy Policy"
      description="How we collect, use, and protect your information while you shop for handcrafted wooden products at Woodmart.lk."
      seoTitle="Privacy Policy | Woodmart.lk"
      seoDescription="Learn how Woodmart.lk collects, uses, and protects your personal information when using our website and services."
      highlights={[
        "Customer data is used to support accounts, orders, delivery, and service.",
        "Trusted tools help us secure accounts, improve the website, and load product images quickly.",
        "Customers can contact us about privacy questions or account data.",
      ]}
      sections={sections}
    />
  );
}

export default PrivacyPolicyPage;
