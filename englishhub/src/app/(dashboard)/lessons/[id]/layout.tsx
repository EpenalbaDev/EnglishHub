export default function LessonEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Override default dashboard padding for full-width builder
  return <div className="-m-6 lg:-m-8">{children}</div>
}
