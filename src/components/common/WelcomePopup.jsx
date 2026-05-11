import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../services/apiClient";
import { useUserAuth } from "../../context/UserAuthContext";

const STORAGE_KEY = "wm_welcome_popup_seen";

function WelcomePopup() {
  const { user, loading: authLoading } = useUserAuth();
  const navigate = useNavigate();

  const [popup, setPopup] = useState(null);
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const timerRef = useRef(null);
  const scrollTriggeredRef = useRef(false);

  // Fetch popup data from backend
  useEffect(() => {
    let cancelled = false;

    const fetchPopup = async () => {
      try {
        const { data } = await apiClient.get("/welcome-popup");
        if (!cancelled) setPopup(data);
      } catch {
        // silently ignore — popup is non-critical
      }
    };

    fetchPopup();

    return () => {
      cancelled = true;
    };
  }, []);

  const shouldShow = useCallback(() => {
    if (authLoading) return false;
    if (user) return false; // logged-in users: never show
    if (!popup?.isActive) return false;
    if (localStorage.getItem(STORAGE_KEY)) return false;
    return true;
  }, [authLoading, user, popup]);

  const openPopup = useCallback(() => {
    if (!shouldShow()) return;
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateIn(true));
    });
  }, [shouldShow]);

  const closePopup = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 350);
  }, []);

  // Set up delay timer + scroll trigger
  useEffect(() => {
    if (!popup || authLoading || user) return;
    if (!popup.isActive) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const delayMs = (popup.delaySeconds ?? 4) * 1000;

    // Delay timer
    timerRef.current = setTimeout(() => {
      openPopup();
    }, delayMs);

    // Scroll trigger (whichever fires first)
    const handleScroll = () => {
      if (scrollTriggeredRef.current) return;
      if (window.scrollY > 120) {
        scrollTriggeredRef.current = true;
        clearTimeout(timerRef.current);
        openPopup();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [popup, authLoading, user, openPopup]);

  const handleCopy = () => {
    if (!popup?.couponCode) return;
    navigator.clipboard
      .writeText(popup.couponCode)
      .then(() => toast.success("Coupon copied successfully!"))
      .catch(() => toast.error("Failed to copy coupon"));
  };

  const handleRegister = () => {
    closePopup();
    navigate("/auth?tab=register");
  };

  if (!visible || !popup) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={closePopup}
        style={{
          background: "rgba(10, 8, 20, 0.72)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          transition: "opacity 350ms ease",
          opacity: animateIn ? 1 : 0,
        }}
        aria-hidden="true"
      />

      {/* Popup card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome offer"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            pointerEvents: "auto",
            transition: "opacity 350ms cubic-bezier(.4,0,.2,1), transform 350ms cubic-bezier(.4,0,.2,1)",
            opacity: animateIn ? 1 : 0,
            transform: animateIn ? "scale(1) translateY(0)" : "scale(0.92) translateY(28px)",
            background: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(249,247,244,0.98) 100%)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.6) inset",
            borderRadius: "1.5rem",
            width: "100%",
            maxWidth: "480px",
            overflow: "hidden",
          }}
        >
          {/* Optional banner image */}
          {popup.imageUrl && (
            <div style={{ height: "180px", overflow: "hidden" }}>
              <img
                src={popup.imageUrl}
                alt="Welcome offer"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {/* Decorative top bar */}
          {!popup.imageUrl && (
            <div
              style={{
                height: "4px",
                background: "linear-gradient(90deg, #0959a4 0%, #1e7fd4 50%, #c2860a 100%)",
              }}
            />
          )}

          <div style={{ padding: "2rem 2rem 1.75rem" }}>
            {/* Close button */}
            <button
              onClick={closePopup}
              aria-label="Close popup"
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                background: "rgba(0,0,0,0.08)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                color: "#555",
                lineHeight: 1,
                transition: "background 200ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.16)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
            >
              ×
            </button>

            {/* Title */}
            <h2
              style={{
                fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
                fontWeight: 700,
                color: "#1a1208",
                marginBottom: "0.5rem",
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
              }}
            >
              {popup.title}
            </h2>

            {/* Description */}
            <p
              style={{
                color: "#5a5048",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              {popup.description}
            </p>

            {/* Coupon block */}
            <div
              style={{
                background: "linear-gradient(135deg, #faf6ed 0%, #f5f0e8 100%)",
                border: "1.5px dashed #c2860a",
                borderRadius: "0.75rem",
                padding: "0.875rem 1rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#8a6520",
                    marginBottom: "0.2rem",
                  }}
                >
                  Your exclusive code
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    color: "#0959a4",
                    fontFamily: "monospace",
                  }}
                >
                  {popup.couponCode}
                </div>
              </div>

              <button
                onClick={handleCopy}
                style={{
                  background: "linear-gradient(135deg, #0959a4 0%, #1e7fd4 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.45rem 0.875rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "opacity 200ms, transform 200ms",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.88";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Copy
              </button>
            </div>

            {/* CTA Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              <button
                onClick={handleRegister}
                style={{
                  width: "100%",
                  padding: "0.875rem 1.5rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  background: "linear-gradient(135deg, #0959a4 0%, #0b70cc 100%)",
                  color: "#fff",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                  boxShadow: "0 4px 16px rgba(9,89,164,0.35)",
                  transition: "box-shadow 200ms, transform 200ms, background 200ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #0748891 0%, #0a66bb 100%)";
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(9,89,164,0.45)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #0959a4 0%, #0b70cc 100%)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(9,89,164,0.35)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {popup.buttonText}
              </button>

              <button
                onClick={closePopup}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: "1.5px solid #e0dbd4",
                  background: "transparent",
                  color: "#7a6e64",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 200ms, color 200ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f5f0e8";
                  e.currentTarget.style.color = "#3a3028";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#7a6e64";
                }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default WelcomePopup;
