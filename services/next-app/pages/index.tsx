import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useEffect, useState } from "react";
import Modal from "../components/Modal";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";
import { listImageProps, s3ImageLoader } from "../utils/cachedImages";
import FileUploader from "@/components/FileUploader";

const Home: NextPage<{ images: ImageProps[] }> = ({ images }) => {
  const router = useRouter();
  const photoIdx = Array.isArray(router.query.photoIdx)
    ? router.query.photoIdx[0]
    : router.query.photoIdx;
  const [lastViewedPhotoIdx, setLastViewedPhotoIdx] = useLastViewedPhoto();

  useEffect(() => {
    // This effect keeps track of the last viewed photo in the modal to keep the index page in sync when the user navigates back
    if (lastViewedPhotoIdx && !photoIdx) {
      lastViewedPhotoRef.current?.scrollIntoView({ block: "center" });
      setLastViewedPhotoIdx(null);
    }
  }, [photoIdx, lastViewedPhotoIdx, setLastViewedPhotoIdx]);

  const lastViewedPhotoRef = useRef<HTMLAnchorElement>(null);
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between`}>
      <div>
        {photoIdx && (
          <Modal
            images={images}
            onClose={() => {
              // @ts-ignore
              setLastViewedPhotoIdx(photoIdx);
            }}
          />
        )}
        <div
          id="gallery"
          className="
            bg-dark
            grid grid-cols-1 
            w-[100vw] 
            py-8
            my-4
            px-2
          "
        >
          <div className="mx-auto max-w-[100%]">
            <div className="flex flex-nowrap max-h-[40vh] overflow-x-auto">
              {images.map(({ idx, filename, meta }) => (
                <Link
                  key={idx}
                  href={`/?photoIdx=${idx}`}
                  as={`/p/${idx}`}
                  ref={
                    idx === Number(lastViewedPhotoIdx)
                      ? lastViewedPhotoRef
                      : null
                  }
                  shallow
                  className="group relative block cursor-zoom-in bg-dark p-1"
                >
                  <Image
                    alt="Carousel Image"
                    className="
                      max-w-none 
                      w-auto
                      min-w-none
                      h-[25vh] 
                      rounded-md lg:rounded-lg 
                      brightness-90 group-hover:brightness-110
                      drop-shadow-lg
                    "
                    style={{ transform: "translate3d(0, 0, 0)" }}
                    loader={s3ImageLoader}
                    src={filename}
                    width={meta.width}
                    height={meta.height}
                    sizes="(max-width: 640px) 100vw,
                      (max-width: 1280px) 50vw,
                      (max-width: 1536px) 33vw,
                      25vw"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <FileUploader />
    </main>
  );
};

export default Home;

export async function getStaticProps() {
  const results = await listImageProps(
    `asset-bucket-${process.env.DOMAIN_NAME}`,
    "assets/gallery/originals"
  );

  let reducedResults: ImageProps[] = [];
  for (let result of results) {
    reducedResults.push({
      filename: result.filename,
      idx: result.idx,
      meta: result.meta,
    });
  }

  return {
    props: {
      images: reducedResults,
    },
    revalidate: 10, // In seconds
  };
}
