import { Component, type ReactNode } from "react";
import { translations, type TranslationKey } from "../../i18n/translations";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Class components cannot use the useLanguage hook; read the persisted
// preference directly (same storage key as LanguageContext).
function tr(key: TranslationKey): string {
  const stored = localStorage.getItem("language");
  const language =
    stored === "en" || stored === "pt-BR" ? stored : "pt-BR";
  return translations[language][key] ?? key;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "var(--color-primary)", marginBottom: "1rem" }}>
            {tr('somethingWentWrong')}
          </h2>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.5rem 1.5rem",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-background)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            {tr('retry')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
