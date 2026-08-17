export default function CmsLayout({ children }: LayoutProps<"/(cms)">) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
