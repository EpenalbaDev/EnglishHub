export default function PresentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Override the dashboard layout - fullscreen, no sidebar/header
  return (
    <div className="fixed inset-0 z-50">
      {children}
    </div>
  )
}
