export enum FashionStyle {
  MINIMALIST = "Minimalist Studio, clean background, soft lighting",
  STREETWEAR = "Urban Street Style, city background, natural light, candid",
  AVANT_GARDE = "Avant-Garde, surreal elements, dramatic high-contrast lighting",
  VINTAGE = "Vintage 90s Editorial, film grain, flash photography",
  LUXURY = "Luxury Glamour, golden hour, opulent setting"
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
}