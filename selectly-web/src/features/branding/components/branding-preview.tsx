"use client"

interface BrandingPreviewProps {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl: string | null
  welcomeMessage: string | null
  studioName: string
}

export function BrandingPreview({
  primaryColor,
  secondaryColor,
  accentColor,
  logoUrl,
  welcomeMessage,
  studioName,
}: BrandingPreviewProps) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: secondaryColor, color: primaryColor }}
    >
      <div className="mx-auto max-w-md space-y-6 text-center">
        {logoUrl && (
          <div className="mx-auto h-16 w-16">
            <img
              src={logoUrl}
              alt={`${studioName} logo`}
              className="h-full w-full object-contain"
            />
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold">{studioName}</h2>
          <p className="mt-1 text-sm opacity-70">Welcome to your proofing gallery</p>
        </div>
        {welcomeMessage && (
          <div
            className="rounded-lg p-4 text-sm"
            style={{ background: accentColor + "20" }}
          >
            {welcomeMessage}
          </div>
        )}
        <button
          type="button"
          className="rounded-lg px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: accentColor }}
        >
          Start Viewing
        </button>
      </div>
    </div>
  )
}
