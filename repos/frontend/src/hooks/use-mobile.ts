import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() =>
    window.innerWidth < MOBILE_BREAKPOINT
  )

  React.useEffect(() => {
    // `resize` drives updates in tests (jsdom) and covers viewport changes
    // in browsers, so a single listener is enough.
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener("resize", onChange)
    return () => window.removeEventListener("resize", onChange)
  }, [])

  return isMobile
}
