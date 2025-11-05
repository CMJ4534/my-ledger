import React from "react";

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.error("[ErrorBoundary]", err);
  }
  render() {
    if (this.state.hasError) return <div>그래프 렌더링 중 오류</div>;
    return this.props.children;
  }
}
