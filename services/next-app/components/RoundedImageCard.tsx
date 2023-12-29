import React from "react";
import Image from "next/image";

export default function RoundedImageCard(
  props: React.ImgHTMLAttributes<HTMLImageElement>
) {
  return (
    <div
      className="
      flex justify-center align-middle
      max-h-auto
      aspect-square
      overflow-hidden 
      rounded-full
      drop-shadow-lg
    "
    >
      <div
        className="
          h-full 
          w-full 
          bg-cover bg-center bg-no-repeat
        "
        style={{ backgroundImage: `url(${props.src})` }}
      />
    </div>
  );
}
