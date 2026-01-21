import { api } from "../utils/axios";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
  timestamp?: string;
}

export interface BannerData {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface BannerInfo {
  filename: string;
  url: string;
  uploadedAt: string;
}

export const uploadBanner = async (file: File) => {
  const formData = new FormData();
  formData.append("banner", file);

  const response = await api.post<ApiEnvelope<BannerData>>(
    "/banners/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const getBanners = async () => {
  const response = await api.get<ApiEnvelope<BannerInfo[]>>("/banners");
  return response.data;
};

export const deleteBanner = async (filename: string) => {
  const response = await api.delete<ApiEnvelope<{ filename: string }>>(
    `/banners/${filename}`
  );
  return response.data;
};
