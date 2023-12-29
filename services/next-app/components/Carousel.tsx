import { useRouter } from "next/router";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";
import SharedModal from "./SharedModal";

export default function Carousel({
  index,
  currentPhoto,
}: {
  index: number;
  currentPhoto: ImageProps;
}) {
  const router = useRouter();
  const [, setLastViewedPhoto] = useLastViewedPhoto();

  function closeModal() {
    // @ts-ignore
    setLastViewedPhoto(currentPhoto.idx);
    router.push("/", undefined, { shallow: true });
  }

  function changePhotoIdx(newVal: number) {
    return newVal;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <button
        className="absolute inset-0 z-30 cursor-default bg-black backdrop-blur-2xl"
        onClick={closeModal}
      />
      <SharedModal
        index={index}
        changePhotoIdx={changePhotoIdx}
        currentPhoto={currentPhoto}
        closeModal={closeModal}
        navigation={false}
      />
    </div>
  );
}
