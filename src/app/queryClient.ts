import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,            // 10초 동안은 신선한 데이터로 취급
      refetchOnWindowFocus: false,     // 탭 포커스 시 자동 재요청 비활성화
    },
  },
});
