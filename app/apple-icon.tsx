import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#06090F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F2F3F5",
          fontSize: 76,
          fontWeight: 600,
          letterSpacing: "-5px",
          fontFamily: "system-ui",
        }}
      >
        kilo<span style={{ color: "#C6FF50" }}>.</span>
      </div>
    ),
    { ...size }
  );
}
