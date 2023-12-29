import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import type { ImageProps } from "../utils/types";
import SharedModal from "./SharedModal";

export default function Modal({
  images,
  onClose,
}: {
  images: ImageProps[];
  onClose: () => void;
}) {
  let overlayRef = useRef();
  const router = useRouter();

  const { photoIdx } = router.query;
  let index = Number(photoIdx);

  const [direction, setDirection] = useState(0);
  const [curIndex, setCurIndex] = useState(index);

  function handleClose() {
    router.push("/", undefined, { shallow: true });
    onClose();
  }

  function changePhotoIdx(newVal: number) {
    if (newVal > index) {
      setDirection(1);
    } else {
      setDirection(-1);
    }
    setCurIndex(newVal);
    router.push(
      {
        query: { photoIdx: newVal },
      },
      `/p/${newVal}`,
      { shallow: true }
    );
  }

  return (
    <Dialog
      static
      open={true}
      onClose={handleClose}
      // @ts-ignore
      initialFocus={overlayRef}
      className="fixed inset-0 z-40 flex items-center justify-center"
    >
      <Dialog.Overlay
        // @ts-ignore
        ref={overlayRef}
        as={motion.div}
        key="backdrop"
        className="fixed inset-0 z-30 bg-black/70 backdrop-blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <SharedModal
        index={curIndex}
        direction={direction}
        images={images}
        changePhotoIdx={changePhotoIdx}
        closeModal={handleClose}
        navigation={true}
      />
    </Dialog>
  );
}
