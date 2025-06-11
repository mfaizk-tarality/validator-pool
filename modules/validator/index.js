import { api } from "@/services/apiServices";
import { useQuery } from "@tanstack/react-query";

export const getStackPlans = () => {
  return useQuery({
    queryKey: ["getStackPlans"],
    queryFn: async () => {
      const response = await api({
        method: "GET",
        url: "/admin/getStackPlans",
      });

      return response?.data?.result;
    },
  });
};
