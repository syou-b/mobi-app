// 이미지 압축 유틸리티

/**
 * Base64 이미지를 압축합니다
 * @param base64Image - data:image/png;base64,... 형식의 이미지
 * @param maxWidth - 최대 너비 (기본: 800px)
 * @param maxHeight - 최대 높이 (기본: 800px)
 * @param quality - 압축 품질 0-1 (기본: 0.7)
 * @returns 압축된 base64 이미지
 */
export const compressImage = (
  base64Image: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // 캔버스 생성
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // 비율 유지하면서 리사이즈
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);

      // JPEG로 압축 (PNG보다 훨씬 작음)
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);

      resolve(compressedBase64);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = base64Image;
  });
};

/**
 * 이미지 크기 계산 (대략적인 바이트 수)
 * @param base64Image - base64 이미지
 * @returns 바이트 수
 */
export const getImageSize = (base64Image: string): number => {
  // base64 디코딩 시 약 75%의 크기
  const base64Length = base64Image.length - (base64Image.indexOf(",") + 1);
  return Math.floor(base64Length * 0.75);
};

/**
 * 이미지 크기를 사람이 읽을 수 있는 형식으로 변환
 * @param bytes - 바이트 수
 * @returns "1.5 MB" 형식의 문자열
 */
export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
