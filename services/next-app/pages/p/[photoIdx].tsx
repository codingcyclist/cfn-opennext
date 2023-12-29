import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Carousel from "../../components/Carousel";
import { listImageProps } from "../../utils/cachedImages";
import type { ImageProps } from "../../utils/types";

const Home: NextPage<{ currentPhoto: ImageProps }> = ({ currentPhoto }) => {
  const router = useRouter();
  const { photoIdx } = router.query;
  let index = Number(photoIdx);

  return (
    <>
      <Head>
        <title>CFN OpenNext</title>
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">
        <Carousel currentPhoto={currentPhoto} index={index} />
      </main>
    </>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async (context) => {
  const results = await listImageProps(
    `asset-bucket-${process.env.DOMAIN_NAME || ""}`,
    "assets/gallery/originals"
  );

  let reducedResults: ImageProps[] = [];
  for (let result of results) {
    reducedResults.push({
      idx: result.idx,
      filename: result.filename,
      meta: result.meta,
    });
  }

  const currentPhoto = reducedResults.find(
    (img) => img.idx === Number(context.params?.photoIdx || "0")
  );

  return {
    props: {
      currentPhoto: currentPhoto,
    },
    revalidate: 10, // In seconds
  };
};

export async function getStaticPaths() {
  const results = await listImageProps(
    `asset-bucket-${process.env.DOMAIN_NAME || ""}`,
    "assets/gallery/originals"
  );

  let fullPaths = [];
  for (let result of results) {
    fullPaths.push({ params: { photoIdx: "" + result.idx } });
  }

  return {
    paths: fullPaths,
    fallback: "blocking",
  };
}
