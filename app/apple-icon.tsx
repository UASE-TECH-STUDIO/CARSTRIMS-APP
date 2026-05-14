import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: "#1A1A1A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 110,
          fontWeight: "bold",
          color: "#F47B20",
          fontFamily: "Georgia, serif",
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}
