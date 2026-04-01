import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function VerifyEmailPage() {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email link...");

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const errorDescription = useMemo(
    () => searchParams.get("error_description") || searchParams.get("error") || "",
    [searchParams]
  );

  useEffect(() => {
    const run = async () => {
      if (errorDescription) {
        setStatus("error");
        setMessage(decodeURIComponent(errorDescription).replace(/\+/g, " "));
        return;
      }

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. Please request a new verification email.");
        return;
      }

      try {
        const response = await verifyEmail({ token });
        setStatus("success");
        setMessage(response.message || "Your email is verified. You can now log in.");
      } catch {
        setStatus("error");
        setMessage("Verification failed or the link expired. Please request a new verification email.");
      }
    };

    run();
  }, [errorDescription, token, verifyEmail]);

  return (
    <section className="container-pad py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-premium">
        <h1 className="font-display text-3xl font-bold text-slate-900">
          {status === "success" ? "Email Verified" : "Email Verification"}
        </h1>
        <p className="mt-3 text-slate-600">{message}</p>

        {status === "loading" && <p className="mt-4 text-sm text-slate-500">Please wait...</p>}

        {status !== "loading" && (
          <div className="mt-6">
            <Link to="/auth" className="btn-primary inline-flex">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default VerifyEmailPage;
